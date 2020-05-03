docker rm -f maklipsacom
docker run --rm -it -p 4000:4000 -v //c/src/maklipsa.com/:/site --name maklipsacom andredumas/github-pages serve --watch --force_polling