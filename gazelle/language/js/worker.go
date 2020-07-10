package js

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/rand"
	"os"
	"os/exec"
	"sync"
)

type workerRequest struct {
	ID      string      `json:"id"`
	Request interface{} `json:"request"`
}

type workerResponse struct {
	ID       string          `json:"id"`
	Error    string          `json:"error"`
	Response json.RawMessage `json:"response"`

	err error `json:"-"`
}

type workerChannel chan *workerResponse

type RpcWorker struct {
	cmd      *exec.Cmd
	writer   io.WriteCloser
	reader   io.ReadCloser
	requests map[string]workerChannel
	mutex    sync.Mutex
	cancel   context.CancelFunc
}

func NewRpcWorker(ctx context.Context, path string) (*RpcWorker, error) {
	c, cancel := context.WithCancel(ctx)
	cmd := exec.CommandContext(c, path)

	cmd.Stderr = os.Stderr
	cmd.Env = append(make([]string, 0), os.Environ()...)
	cmd.Env = append(cmd.Env, "RUNFILES_MANIFEST_ONLY=1")

	writer, err := cmd.StdinPipe()

	if err != nil {
		return nil, err
	}

	reader, err := cmd.StdoutPipe()

	if err != nil {
		return nil, err
	}

	return &RpcWorker{
		cmd:      cmd,
		reader:   reader,
		writer:   writer,
		requests: make(map[string]workerChannel),
		cancel:   cancel,
	}, nil
}

func (w *RpcWorker) Start() error {
	err := w.cmd.Start()

	if err != nil {
		return err
	}

	defer w.cancel()

	rl := bufio.NewReader(w.reader)

	for true {
		var buf []byte

		for true {
			l, prefix, err := rl.ReadLine()

			if err != nil {
				return err
			}

			buf = append(buf, l...)

			if !prefix {
				break
			}
		}

		res := &workerResponse{}
		err := json.Unmarshal(buf, res)

		if err != nil {
			return err
		}

		ch, found := w.consumeResponseChannel(res.ID)

		if !found {
			log.Printf("got worker reply for invalid request %s", res.ID)
		}

		ch <- res
	}

	return nil
}

func (w *RpcWorker) Request(request, response interface{}) error {
	return w.RequestWithContext(context.Background(), request, response)
}

func (w *RpcWorker) RequestWithContext(ctx context.Context, request, response interface{}) error {
	ch := make(workerChannel)
	err := w.sendRequest(request, ch)

	if err != nil {
		return err
	}

	select {
	case <-ctx.Done():
		return context.Canceled
	case res := <-ch:
		if res.err != nil {
			return err
		}

		if res.Error != "" {
			return fmt.Errorf("%s", res.Error)
		}

		return json.Unmarshal(res.Response, response)
	}
}

func (w *RpcWorker) sendRequest(request interface{}, ch workerChannel) error {
	var id string

	w.mutex.Lock()
	defer w.mutex.Unlock()

	enc := json.NewEncoder(w.writer)

	for true {
		id = fmt.Sprintf("%d", rand.Int())
		_, found := w.requests[id]

		if !found {
			break
		}
	}

	w.requests[id] = ch

	req := &workerRequest{
		ID:      id,
		Request: request,
	}

	err := enc.Encode(req)

	if err != nil {
		return err
	}

	return nil
}

func (w *RpcWorker) consumeResponseChannel(id string) (workerChannel, bool) {
	w.mutex.Lock()
	defer w.mutex.Unlock()

	ch, found := w.requests[id]
	delete(w.requests, id)

	return ch, found
}
