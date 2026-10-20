V3.18.22 - Lara smoke test

Replace root worker.js and add root package.json. Do not replace existing package.json if one exists; merge dependencies instead. Commit and push through GitHub Desktop. After Cloudflare deployment, sign in as Reporter at /news/admin/ then open https://kingdom3903.com/api/herald/lara/test . The test translates a fixed English sentence to German. No D1 writes or article changes. The test consumes a few API characters. If Cloudflare build fails, do not force deployment; send build log.
