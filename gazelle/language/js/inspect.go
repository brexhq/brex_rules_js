package js

import (
	"context"
)

type inspectCodeRequest struct {
	FileName string `json:"filename"`
}

type inspectCodeResponse struct {
	Imports       []string `json:"imports"`
}

type inspectYarnRequest struct {
	FileName string `json:"filename"`
}

type inspectYarnResponse struct {
	Deps map[string]NpmPackageDepInfo `json:"deps"`
}

type inspectRequest struct {
	Code *inspectCodeRequest `json:"code,omitempty"`
	Yarn *inspectYarnRequest `json:"yarn,omitempty"`
}

type InspectWorker struct {
	*RpcWorker
}

func NewInspectWorker(ctx context.Context, path string) (*InspectWorker, error) {
	w, err := NewRpcWorker(ctx, path)

	if err != nil {
		return nil, err
	}

	return &InspectWorker{
		RpcWorker: w,
	}, nil
}

func (w *InspectWorker) InspectCode(filename string) (*FileInfo, error) {
	var res inspectCodeResponse

	err := w.Request(&inspectRequest{
		Code: &inspectCodeRequest{
			FileName: filename,
		},
	}, &res)

	if err != nil {
		return nil, err
	}

	return BuildFileInfo(filename, res.Imports), nil
}

func (w *InspectWorker) InspectYarn(filename string) (map[string]NpmPackageDepInfo, error) {
	var res inspectYarnResponse

	err := w.Request(&inspectRequest{
		Yarn: &inspectYarnRequest{
			FileName: filename,
		},
	}, &res)

	if err != nil {
		return nil, err
	}

	return res.Deps, nil
}
