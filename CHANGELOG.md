## 0.3.1 (2023-10-18)

### Bug Fixes

* **core:** delete require cache when hot reload ([983a830](https://github.com/tuner-proxy/tuner/commit/983a83044e59785886b8a0922a535a1414db0e6c))

# 0.3.0 (2023-10-08)

### Bug Fixes

* **create-tuner:** copy gitignore to  project path ([833d6e9](https://github.com/tuner-proxy/tuner/commit/833d6e928a9e71276777caf3433123f9ab404a00))
* **create-tuner:** update mock script ([06ef4cd](https://github.com/tuner-proxy/tuner/commit/06ef4cd9f1aa3ace78403f53909dd1ef0d471e39))
* **util:** read proxy-authorization from raw headers ([a5f5582](https://github.com/tuner-proxy/tuner/commit/a5f5582c44c9ad05287d45e230b537e84e5df8fd))

### Features

* **core:** support init command ([bc082c6](https://github.com/tuner-proxy/tuner/commit/bc082c63952cf35fc277d0f690ec2430d0f6881d))
* **create-tuner:** only prompt init script for windows and macos ([912e80c](https://github.com/tuner-proxy/tuner/commit/912e80c5ded413aa152991448c5371dbb80c107a))
* **create-tuner:** prompt init script after scaffolding ([bae8189](https://github.com/tuner-proxy/tuner/commit/bae8189879ec432a202004b9237344601c0157bf))
* **create-tuner:** update template project ([f74bbd0](https://github.com/tuner-proxy/tuner/commit/f74bbd0aa19a22b3fb91381bf7cdae0b4e9e6457))
* **util:** add basicAuth helper fn ([7bdedd5](https://github.com/tuner-proxy/tuner/commit/7bdedd5c99bf920db7fe891a1c2594ba880eab16))

### BREAKING CHANGES

* **core:** default command is renamed to `tuner start`

## 0.2.2 (2023-08-27)

### Features

* **util:** deprecate decrypt ([90d6186](https://github.com/gzzhanghao/tuner/commit/90d61864e54cb0679fe4cdd8956c03b67e2f8a42))

## 0.2.1 (2023-08-27)

### Bug Fixes

* **util:** support h2 & ws with unencrypted connection ([#15](https://github.com/gzzhanghao/tuner/issues/15)) ([7f7443e](https://github.com/gzzhanghao/tuner/commit/7f7443e28ee305de327414ac2926d516b5a7e10a))

### Features

* **core:** support ip matching ([5c59319](https://github.com/gzzhanghao/tuner/commit/5c5931974518671a51792d9f6eab2873971ad686))
* support tls for ip address ([30d49b0](https://github.com/gzzhanghao/tuner/commit/30d49b0756c0f5d6bb40da4475a73fe5ead83c99))

# 0.2.0 (2023-08-09)

### Bug Fixes

* **core:** use local jest-cli ([5a13b89](https://github.com/gzzhanghao/tuner/commit/5a13b89f4581dbcda3b1cd987d3c37e0316ce21d))
* **create-tuner:** add template to package files ([95be55c](https://github.com/gzzhanghao/tuner/commit/95be55cb4cd2c3d479591195adc1a1df5ced0c2f))
* **ui:** add estree prettier plugin & print prettier error ([a3843f2](https://github.com/gzzhanghao/tuner/commit/a3843f29ee991b6e352f0490ce3745d9c0427975))
* **ui:** trigger display body update immediately ([1bc97cc](https://github.com/gzzhanghao/tuner/commit/1bc97ccfb27e5ba4133d82ad981d2ba68ad73a74))

### Features

* **create-tuner:** add create-tuner ([4868533](https://github.com/gzzhanghao/tuner/commit/4868533715dd0ebd30bd4f5c28773c735f988520))
