load("@brex_rules_js//:defs.bzl", "npm_package_index")

def js_deps():
    npm_package_index(
        name = "@npm//@bazel/typescript",
        dev_only = False,
        integrity = "sha512-M6JPXJZ+W6457QZfPHmGg/Mejnp7//YTnffGmnmeK9vDqybXeCCRWW1/iEOwopLJYQViBHfaoulde0VXelx9sA==",
        module_name = "@bazel/typescript",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@bazel/typescript/-/typescript-1.7.0.tgz#8dc02b8a161f4fff3285186066b5f73666793452",
        version = "1.7.0",
    )
    npm_package_index(
        name = "@npm//@types/diff",
        dev_only = False,
        integrity = "sha512-mIenTfsIe586/yzsyfql69KRnA75S8SVXQbTLpDejRrjH0QSJcpu3AUOi/Vjnt9IOsXKxPhJfGpQUNMueIU1fQ==",
        module_name = "@types/diff",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@types/diff/-/diff-4.0.2.tgz#2e9bb89f9acc3ab0108f0f3dc4dbdcf2fff8a99c",
        version = "4.0.2",
    )
    npm_package_index(
        name = "@npm//typescript",
        dev_only = False,
        integrity = "sha512-Pspx3oKAPJtjNwE92YS05HQoY7z2SFyOpHo9MqJor3BXAGNaPUs83CuVp9VISFkSjyRfiTpmKuAYGJB7S7hOxw==",
        module_name = "typescript",
        optional = False,
        resolved = "https://registry.yarnpkg.com/typescript/-/typescript-3.9.6.tgz#8f3e0198a34c3ae17091b35571d3afd31999365a",
        version = "3.9.6",
    )
    npm_package_index(
        name = "@npm//@types/babel__core",
        dev_only = False,
        integrity = "sha512-sY2RsIJ5rpER1u3/aQ8OFSI7qGIy8o1NEEbgb2UaJcvOtXOMpd39ko723NBpjQFg9SIX7TXtjejZVGeIMLhoOw==",
        module_name = "@types/babel__core",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@types/babel__core/-/babel__core-7.1.9.tgz#77e59d438522a6fb898fa43dc3455c6e72f3963d",
        version = "7.1.9",
    )
    npm_package_index(
        name = "@npm//@babel/core",
        dev_only = False,
        integrity = "sha512-3A0tS0HWpy4XujGc7QtOIHTeNwUgWaZc/WuS5YQrfhU67jnVmsD6OGPc1AKHH0LJHQICGncy3+YUjIhVlfDdcA==",
        module_name = "@babel/core",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/core/-/core-7.10.4.tgz#780e8b83e496152f8dd7df63892b2e052bf1d51d",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@babel/preset-env",
        dev_only = False,
        integrity = "sha512-tcmuQ6vupfMZPrLrc38d0sF2OjLT3/bZ0dry5HchNCQbrokoQi4reXqclvkkAT5b+gWc23meVWpve5P/7+w/zw==",
        module_name = "@babel/preset-env",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/preset-env/-/preset-env-7.10.4.tgz#fbf57f9a803afd97f4f32e4f798bb62e4b2bef5f",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@babel/plugin-proposal-class-properties",
        dev_only = False,
        integrity = "sha512-vhwkEROxzcHGNu2mzUC0OFFNXdZ4M23ib8aRRcJSsW8BZK9pQMD7QB7csl97NBbgGZO7ZyHUyKDnxzOaP4IrCg==",
        module_name = "@babel/plugin-proposal-class-properties",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/plugin-proposal-class-properties/-/plugin-proposal-class-properties-7.10.4.tgz#a33bf632da390a59c7a8c570045d1115cd778807",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@types/babel__traverse",
        dev_only = False,
        integrity = "sha512-i+zS7t6/s9cdQvbqKDARrcbrPvtJGlbYsMkazo03nTAK3RX9FNrLllXys22uiTGJapPOTZTQ35nHh4ISph4SLQ==",
        module_name = "@types/babel__traverse",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@types/babel__traverse/-/babel__traverse-7.0.13.tgz#1874914be974a492e1b4cb00585cabb274e8ba18",
        version = "7.0.13",
    )
    npm_package_index(
        name = "@npm//@types/resolve",
        dev_only = False,
        integrity = "sha512-yy7HuzQhj0dhGpD8RLXSZWEkLsV9ibvxvi6EiJ3bkqLAO1RGo0WbkWQiwpRlSFymTJRz0d3k5LM3kkx8ArDbLw==",
        module_name = "@types/resolve",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@types/resolve/-/resolve-1.17.1.tgz#3afd6ad8967c77e4376c598a82ddd58f46ec45d6",
        version = "1.17.1",
    )
    npm_package_index(
        name = "@npm//enhanced-resolve",
        dev_only = False,
        integrity = "sha512-S7eiFb/erugyd1rLb6mQ3Vuq+EXHv5cpCkNqqIkYkBgN2QdFnyCZzFBleqwGEx4lgNGYij81BWnCrFNK7vxvjQ==",
        module_name = "enhanced-resolve",
        optional = False,
        resolved = "https://registry.yarnpkg.com/enhanced-resolve/-/enhanced-resolve-4.2.0.tgz#5d43bda4a0fd447cb0ebbe71bef8deff8805ad0d",
        version = "4.2.0",
    )
    npm_package_index(
        name = "@npm//@babel/plugin-proposal-optional-chaining",
        dev_only = False,
        integrity = "sha512-ZIhQIEeavTgouyMSdZRap4VPPHqJJ3NEs2cuHs5p0erH+iz6khB0qfgU8g7UuJkG88+fBMy23ZiU+nuHvekJeQ==",
        module_name = "@babel/plugin-proposal-optional-chaining",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/plugin-proposal-optional-chaining/-/plugin-proposal-optional-chaining-7.10.4.tgz#750f1255e930a1f82d8cdde45031f81a0d0adff7",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@types/yarnpkg__lockfile",
        dev_only = False,
        integrity = "sha512-mhdQq10tYpiNncMkg1vovCud5jQm+rWeRVz6fxjCJlY6uhDlAn9GnMSmBa2DQwqPf/jS5YR0K/xChDEh1jdOQg==",
        module_name = "@types/yarnpkg__lockfile",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@types/yarnpkg__lockfile/-/yarnpkg__lockfile-1.1.3.tgz#38fb31d82ed07dea87df6bd565721d11979fd761",
        version = "1.1.3",
    )
    npm_package_index(
        name = "@npm//@babel/parser",
        dev_only = False,
        integrity = "sha512-8jHII4hf+YVDsskTF6WuMB3X4Eh+PsUkC2ljq22so5rHvH+T8BzyL94VOdyFLNR8tBSVXOTbNHOKpR4TfRxVtA==",
        module_name = "@babel/parser",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/parser/-/parser-7.10.4.tgz#9eedf27e1998d87739fb5028a5120557c06a1a64",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//eslint-config-airbnb-base",
        dev_only = True,
        integrity = "sha512-Snswd5oC6nJaevs3nZoLSTvGJBvzTfnBqOIArkf3cbyTyq9UD79wOk8s+RiL6bhca0p/eRO6veczhf6A/7Jy8Q==",
        module_name = "eslint-config-airbnb-base",
        optional = False,
        resolved = "https://registry.yarnpkg.com/eslint-config-airbnb-base/-/eslint-config-airbnb-base-14.2.0.tgz#fe89c24b3f9dc8008c9c0d0d88c28f95ed65e9c4",
        version = "14.2.0",
    )
    npm_package_index(
        name = "@npm//resolve",
        dev_only = False,
        integrity = "sha512-ic+7JYiV8Vi2yzQGFWOkiZD5Z9z7O2Zhm9XMaTxdJExKasieFCr+yXZ/WmXsckHiKl12ar0y6XiXDx3m4RHn1w==",
        module_name = "resolve",
        optional = False,
        resolved = "https://registry.yarnpkg.com/resolve/-/resolve-1.17.0.tgz#b25941b54968231cc2d1bb76a79cb7f2c0bf8444",
        version = "1.17.0",
    )
    npm_package_index(
        name = "@npm//@babel/traverse",
        dev_only = False,
        integrity = "sha512-aSy7p5THgSYm4YyxNGz6jZpXf+Ok40QF3aA2LyIONkDHpAcJzDUqlCKXv6peqYUs2gmic849C/t2HKw2a2K20Q==",
        module_name = "@babel/traverse",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/traverse/-/traverse-7.10.4.tgz#e642e5395a3b09cc95c8e74a27432b484b697818",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@types/eslint",
        dev_only = False,
        integrity = "sha512-LpUXkr7fnmPXWGxB0ZuLEzNeTURuHPavkC5zuU4sg62/TgL5ZEjamr5Y8b6AftwHtx2bPJasI+CL0TT2JwQ7aA==",
        module_name = "@types/eslint",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@types/eslint/-/eslint-7.2.0.tgz#eb5c5b575237334df24c53195e37b53d66478d7b",
        version = "7.2.0",
    )
    npm_package_index(
        name = "@npm//@typescript-eslint/parser",
        dev_only = False,
        integrity = "sha512-taghDxuLhbDAD1U5Fk8vF+MnR0yiFE9Z3v2/bYScFb0N1I9SK8eKHkdJl1DAD48OGFDMFTeOTX0z7g0W6SYUXw==",
        module_name = "@typescript-eslint/parser",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@typescript-eslint/parser/-/parser-3.6.0.tgz#79b5232e1a2d06f1fc745942b690cd87aca7b60e",
        version = "3.6.0",
    )
    npm_package_index(
        name = "@npm//jest-junit-reporter",
        dev_only = False,
        integrity = "sha1-iNYAbsE/gt9AxHiCyGQJic3LFDQ=",
        module_name = "jest-junit-reporter",
        optional = False,
        resolved = "https://registry.yarnpkg.com/jest-junit-reporter/-/jest-junit-reporter-1.1.0.tgz#88d6006ec13f82df40c47882c8640989cdcb1434",
        version = "1.1.0",
    )
    npm_package_index(
        name = "@npm//minimist",
        dev_only = False,
        integrity = "sha512-FM9nNUYrRBAELZQT3xeZQ7fmMOBg6nWNmJKTcgsJeaLstP/UODVpGsr5OhXhhXg6f+qtJ8uiZ+PUxkDWcgIXLw==",
        module_name = "minimist",
        optional = False,
        resolved = "https://registry.yarnpkg.com/minimist/-/minimist-1.2.5.tgz#67d66014b66a6a8aaa0c083c5fd58df4e4e97602",
        version = "1.2.5",
    )
    npm_package_index(
        name = "@npm//grpc_tools_node_protoc_ts",
        dev_only = False,
        integrity = "sha512-a4A3tadLwh5QGPlc31TSKAf40+HxFXh/nnW2driDBqAgVcMKkcZEVQpEnJJOU4lNqs2QwLFgPm9pUr/Hd+uv9g==",
        module_name = "grpc_tools_node_protoc_ts",
        optional = False,
        resolved = "https://registry.yarnpkg.com/grpc_tools_node_protoc_ts/-/grpc_tools_node_protoc_ts-3.0.0.tgz#02cf4bb7945b9c120f038447a2e2fa2164f2bef5",
        version = "3.0.0",
    )
    npm_package_index(
        name = "@npm//eslint",
        dev_only = False,
        integrity = "sha512-gU+lxhlPHu45H3JkEGgYhWhkR9wLHHEXC9FbWFnTlEkbKyZKWgWRLgf61E8zWmBuI6g5xKBph9ltg3NtZMVF8g==",
        module_name = "eslint",
        optional = False,
        resolved = "https://registry.yarnpkg.com/eslint/-/eslint-7.4.0.tgz#4e35a2697e6c1972f9d6ef2b690ad319f80f206f",
        version = "7.4.0",
    )
    npm_package_index(
        name = "@npm//@babel/plugin-syntax-typescript",
        dev_only = False,
        integrity = "sha512-oSAEz1YkBCAKr5Yiq8/BNtvSAPwkp/IyUnwZogd8p+F0RuYQQrLeRUzIQhueQTTBy/F+a40uS7OFKxnkRvmvFQ==",
        module_name = "@babel/plugin-syntax-typescript",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/plugin-syntax-typescript/-/plugin-syntax-typescript-7.10.4.tgz#2f55e770d3501e83af217d782cb7517d7bb34d25",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@babel/plugin-transform-typescript",
        dev_only = False,
        integrity = "sha512-3WpXIKDJl/MHoAN0fNkSr7iHdUMHZoppXjf2HJ9/ed5Xht5wNIsXllJXdityKOxeA3Z8heYRb1D3p2H5rfCdPw==",
        module_name = "@babel/plugin-transform-typescript",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/plugin-transform-typescript/-/plugin-transform-typescript-7.10.4.tgz#8b01cb8d77f795422277cc3fcf45af72bc68ba78",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//babel-plugin-transform-typescript-metadata",
        dev_only = False,
        integrity = "sha512-ASYrM+bxtpfgZKsAOqQfjmLlekIDigRnNCfQBDOOdaqL18hLhZIsbdiHsuaNDTkljlqnbV/DlufaWY55jC2PBg==",
        module_name = "babel-plugin-transform-typescript-metadata",
        optional = False,
        resolved = "https://registry.yarnpkg.com/babel-plugin-transform-typescript-metadata/-/babel-plugin-transform-typescript-metadata-0.3.0.tgz#70093ea8611baf985293fb3ec704d1b7db737ad9",
        version = "0.3.0",
    )
    npm_package_index(
        name = "@npm//diff",
        dev_only = False,
        integrity = "sha512-58lmxKSA4BNyLz+HHMUzlOEpg09FV+ev6ZMe3vJihgdxzgcwZ8VoEEPmALCZG9LmqfVoNMMKpttIYTVG6uDY7A==",
        module_name = "diff",
        optional = False,
        resolved = "https://registry.yarnpkg.com/diff/-/diff-4.0.2.tgz#60f3aecb89d5fae520c11aa19efc2bb982aade7d",
        version = "4.0.2",
    )
    npm_package_index(
        name = "@npm//eslint-config-prettier",
        dev_only = True,
        integrity = "sha512-oB8cpLWSAjOVFEJhhyMZh6NOEOtBVziaqdDQ86+qhDHFbZXoRTM7pNSvFRfW/W/L/LrQ38C99J5CGuRBBzBsdA==",
        module_name = "eslint-config-prettier",
        optional = False,
        resolved = "https://registry.yarnpkg.com/eslint-config-prettier/-/eslint-config-prettier-6.11.0.tgz#f6d2238c1290d01c859a8b5c1f7d352a0b0da8b1",
        version = "6.11.0",
    )
    npm_package_index(
        name = "@npm//@bazel/worker",
        dev_only = False,
        integrity = "sha512-bv/wqsOczcQ26KzxMDoW0o5WkMbTGAnOUTNxCpd5xuRnoQV4O+QWW23tp3CXRkJot/tJ9D4Mk1yKPn6dgLi3og==",
        module_name = "@bazel/worker",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@bazel/worker/-/worker-1.7.0.tgz#9341ca7715cf4fdfa24aa1f6fe334eb53053fdf9",
        version = "1.7.0",
    )
    npm_package_index(
        name = "@npm//@babel/plugin-proposal-nullish-coalescing-operator",
        dev_only = False,
        integrity = "sha512-wq5n1M3ZUlHl9sqT2ok1T2/MTt6AXE0e1Lz4WzWBr95LsAZ5qDXe4KnFuauYyEyLiohvXFMdbsOTMyLZs91Zlw==",
        module_name = "@babel/plugin-proposal-nullish-coalescing-operator",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/plugin-proposal-nullish-coalescing-operator/-/plugin-proposal-nullish-coalescing-operator-7.10.4.tgz#02a7e961fc32e6d5b2db0649e01bf80ddee7e04a",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@babel/preset-typescript",
        dev_only = False,
        integrity = "sha512-SdYnvGPv+bLlwkF2VkJnaX/ni1sMNetcGI1+nThF1gyv6Ph8Qucc4ZZAjM5yZcE/AKRXIOTZz7eSRDWOEjPyRQ==",
        module_name = "@babel/preset-typescript",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/preset-typescript/-/preset-typescript-7.10.4.tgz#7d5d052e52a682480d6e2cc5aa31be61c8c25e36",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//eslint-plugin-import",
        dev_only = False,
        integrity = "sha512-66Fpf1Ln6aIS5Gr/55ts19eUuoDhAbZgnr6UxK5hbDx6l/QgQgx61AePq+BV4PP2uXQFClgMVzep5zZ94qqsxg==",
        module_name = "eslint-plugin-import",
        optional = False,
        resolved = "https://registry.yarnpkg.com/eslint-plugin-import/-/eslint-plugin-import-2.22.0.tgz#92f7736fe1fde3e2de77623c838dd992ff5ffb7e",
        version = "2.22.0",
    )
    npm_package_index(
        name = "@npm//yargs",
        dev_only = False,
        integrity = "sha512-D3fRFnZwLWp8jVAAhPZBsmeIHY8tTsb8ItV9KaAaopmC6wde2u6Yw29JBIZHXw14kgkRnYmDgmQU4FVMDlIsWw==",
        module_name = "yargs",
        optional = False,
        resolved = "https://registry.yarnpkg.com/yargs/-/yargs-15.4.0.tgz#53949fb768309bac1843de9b17b80051e9805ec2",
        version = "15.4.0",
    )
    npm_package_index(
        name = "@npm//@babel/types",
        dev_only = False,
        integrity = "sha512-UTCFOxC3FsFHb7lkRMVvgLzaRVamXuAs2Tz4wajva4WxtVY82eZeaUBtC2Zt95FU9TiznuC0Zk35tsim8jeVpg==",
        module_name = "@babel/types",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/types/-/types-7.10.4.tgz#369517188352e18219981efd156bfdb199fff1ee",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@typescript-eslint/eslint-plugin",
        dev_only = False,
        integrity = "sha512-ubHlHVt1lsPQB/CZdEov9XuOFhNG9YRC//kuiS1cMQI6Bs1SsqKrEmZnpgRwthGR09/kEDtr9MywlqXyyYd8GA==",
        module_name = "@typescript-eslint/eslint-plugin",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@typescript-eslint/eslint-plugin/-/eslint-plugin-3.6.0.tgz#ba2b6cae478b8fca3f2e58ff1313e4198eea2d8a",
        version = "3.6.0",
    )
    npm_package_index(
        name = "@npm//vscode-uri",
        dev_only = False,
        integrity = "sha512-8TEXQxlldWAuIODdukIb+TR5s+9Ds40eSJrw+1iDDA9IFORPjMELarNQE3myz5XIkWWpdprmJjm1/SxMlWOC8A==",
        module_name = "vscode-uri",
        optional = False,
        resolved = "https://registry.yarnpkg.com/vscode-uri/-/vscode-uri-2.1.2.tgz#c8d40de93eb57af31f3c715dd650e2ca2c096f1c",
        version = "2.1.2",
    )
    npm_package_index(
        name = "@npm//grpc-tools",
        dev_only = False,
        integrity = "sha512-du10qytFNDVNYGJQ/AxXTF6lXchgCZ7ls8BtBDCtnuinjGbnPFHpOIzoEAT8NsmgFg4RCpsWW8vsQ+RCyQ3SXA==",
        module_name = "grpc-tools",
        optional = False,
        resolved = "https://registry.yarnpkg.com/grpc-tools/-/grpc-tools-1.9.0.tgz#57fd0f577dbf842e03215857582f5dc808d96cad",
        version = "1.9.0",
    )
    npm_package_index(
        name = "@npm//@yarnpkg/lockfile",
        dev_only = False,
        integrity = "sha512-GpSwvyXOcOOlV70vbnzjj4fW5xW/FdUF6nQEt1ENy7m4ZCczi1+/buVUPAqmGfqznsORNFzUMjctTIp8a9tuCQ==",
        module_name = "@yarnpkg/lockfile",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@yarnpkg/lockfile/-/lockfile-1.1.0.tgz#e77a97fbd345b76d83245edcd17d393b1b41fb31",
        version = "1.1.0",
    )
    npm_package_index(
        name = "@npm//node-worker-threads-pool",
        dev_only = False,
        integrity = "sha512-RP5tJ/8EuqMlmMOTbhRQx7WlMHf6tCxPwp/ll1sY61E3aHwjc0xcwN4No189o1Z3L9ezkA+5qIOvFQrnMvOlpg==",
        module_name = "node-worker-threads-pool",
        optional = False,
        resolved = "https://registry.yarnpkg.com/node-worker-threads-pool/-/node-worker-threads-pool-1.3.3.tgz#bfad2615cf7cf7e5a9d15772e99b0f3cf4bd05e3",
        version = "1.3.3",
    )
    npm_package_index(
        name = "@npm//eslint-plugin-prettier",
        dev_only = True,
        integrity = "sha512-jZDa8z76klRqo+TdGDTFJSavwbnWK2ZpqGKNZ+VvweMW516pDUMmQ2koXvxEE4JhzNvTv+radye/bWGBmA6jmg==",
        module_name = "eslint-plugin-prettier",
        optional = False,
        resolved = "https://registry.yarnpkg.com/eslint-plugin-prettier/-/eslint-plugin-prettier-3.1.4.tgz#168ab43154e2ea57db992a2cd097c828171f75c2",
        version = "3.1.4",
    )
    npm_package_index(
        name = "@npm//@babel/plugin-proposal-decorators",
        dev_only = False,
        integrity = "sha512-JHTWjQngOPv+ZQQqOGv2x6sCCr4IYWy7S1/VH6BE9ZfkoLrdQ2GpEP3tfb5M++G9PwvqjhY8VC/C3tXm+/eHvA==",
        module_name = "@babel/plugin-proposal-decorators",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/plugin-proposal-decorators/-/plugin-proposal-decorators-7.10.4.tgz#fe20ef10cc73f386f70910fca48798041cd357c7",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//@jest/core",
        dev_only = False,
        integrity = "sha512-zyizYmDJOOVke4OO/De//aiv8b07OwZzL2cfsvWF3q9YssfpcKfcnZAwDY8f+A76xXSMMYe8i/f/LPocLlByfw==",
        module_name = "@jest/core",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@jest/core/-/core-26.1.0.tgz#4580555b522de412a7998b3938c851e4f9da1c18",
        version = "26.1.0",
    )
    npm_package_index(
        name = "@npm//prettier",
        dev_only = True,
        integrity = "sha512-7PtVymN48hGcO4fGjybyBSIWDsLU4H4XlvOHfq91pz9kkGlonzwTfYkaIEwiRg/dAJF9YlbsduBAgtYLi+8cFg==",
        module_name = "prettier",
        optional = False,
        resolved = "https://registry.yarnpkg.com/prettier/-/prettier-2.0.5.tgz#d6d56282455243f2f92cc1716692c08aa31522d4",
        version = "2.0.5",
    )
    npm_package_index(
        name = "@npm//graphql",
        dev_only = False,
        integrity = "sha512-GTCJtzJmkFLWRfFJuoo9RWWa/FfamUHgiFosxi/X1Ani4AVWbeyBenZTNX6dM+7WSbbFfTo/25eh0LLkwHMw2w==",
        module_name = "graphql",
        optional = False,
        resolved = "https://registry.yarnpkg.com/graphql/-/graphql-15.3.0.tgz#3ad2b0caab0d110e3be4a5a9b2aa281e362b5278",
        version = "15.3.0",
    )
    npm_package_index(
        name = "@npm//@babel/plugin-proposal-object-rest-spread",
        dev_only = False,
        integrity = "sha512-6vh4SqRuLLarjgeOf4EaROJAHjvu9Gl+/346PbDH9yWbJyfnJ/ah3jmYKYtswEyCoWZiidvVHjHshd4WgjB9BA==",
        module_name = "@babel/plugin-proposal-object-rest-spread",
        optional = False,
        resolved = "https://registry.yarnpkg.com/@babel/plugin-proposal-object-rest-spread/-/plugin-proposal-object-rest-spread-7.10.4.tgz#50129ac216b9a6a55b3853fdd923e74bf553a4c0",
        version = "7.10.4",
    )
    npm_package_index(
        name = "@npm//webpack",
        dev_only = False,
        integrity = "sha512-GW1LjnPipFW2Y78OOab8NJlCflB7EFskMih2AHdvjbpKMeDJqEgSx24cXXXiPS65+WSwVyxtDsJH6jGX2czy+g==",
        module_name = "webpack",
        optional = False,
        resolved = "https://registry.yarnpkg.com/webpack/-/webpack-4.43.0.tgz#c48547b11d563224c561dad1172c8aa0b8a678e6",
        version = "4.43.0",
    )
    npm_package_index(
        name = "@npm//apollo-codegen-typescript",
        dev_only = False,
        integrity = "sha512-tuf/AQTFcNrngQrT4q4WKRdiuPbglyR1m3L58g/nNevoO0cRmF6koIix4NB5sO05LgF8XJmd2zHvInUI5v33Ig==",
        module_name = "apollo-codegen-typescript",
        optional = False,
        resolved = "https://registry.yarnpkg.com/apollo-codegen-typescript/-/apollo-codegen-typescript-0.37.3.tgz#81cff4f8a06921f20ff24854d34aa22f9ff38f4f",
        version = "0.37.3",
    )
    npm_package_index(
        name = "@npm//webpack-dev-server",
        dev_only = False,
        integrity = "sha512-PUxZ+oSTxogFQgkTtFndEtJIPNmml7ExwufBZ9L2/Xyyd5PnOL5UreWe5ZT7IU25DSdykL9p1MLQzmLh2ljSeg==",
        module_name = "webpack-dev-server",
        optional = False,
        resolved = "https://registry.yarnpkg.com/webpack-dev-server/-/webpack-dev-server-3.11.0.tgz#8f154a3bce1bcfd1cc618ef4e703278855e7ff8c",
        version = "3.11.0",
    )
    npm_package_index(
        name = "@npm//apollo-language-server",
        dev_only = False,
        integrity = "sha512-RurKlBUNE1RrvY4m93b5WS/DXInUEI47MlzuvholRqZSQovt2rQi81R0RvmS/l3d6y5TBfxbPFpT5RyHbdAntw==",
        module_name = "apollo-language-server",
        optional = False,
        resolved = "https://registry.yarnpkg.com/apollo-language-server/-/apollo-language-server-1.22.3.tgz#486e77f3a84d56373e03299de8810e8c699a005b",
        version = "1.22.3",
    )
    npm_package_index(
        name = "@npm//apollo-codegen-core",
        dev_only = False,
        integrity = "sha512-/DwAhOOFzl57GdBfRGNnqIAcfZAXpsgFIeWYqlu3I/eIucGBCFWo9CEW1TcNwkZzYGAmSE8tURwPgt7dtnhFpg==",
        module_name = "apollo-codegen-core",
        optional = False,
        resolved = "https://registry.yarnpkg.com/apollo-codegen-core/-/apollo-codegen-core-0.37.3.tgz#d3398075a76e8017d797498d2d2e4bd9bbc428fc",
        version = "0.37.3",
    )
