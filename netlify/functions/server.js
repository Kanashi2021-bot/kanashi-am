const express = require('express');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTE HANDLER PROXY ALIGHT MOTION (NETLIFY SAFE FETCH)
app.all('*', async (req, res) => {
    try {
        // 1. Bersihkan path URL agar tidak terbawa prefix netlify
        let cleanPath = req.originalUrl || req.url || '';
        cleanPath = cleanPath.replace(/^\/\.netlify\/functions\/[^\/]+/, '');
        if (!cleanPath.startsWith('/')) cleanPath = '/' + cleanPath;

        const targetUrl = `https://api.alightcreative.com${cleanPath}`;

        // 2. Filter header yang aman untuk fetch serverless
        const allowedHeaders = {};
        const safeHeaderKeys = ['content-type', 'authorization', 'user-agent', 'accept'];
        
        for (const [key, value] of Object.entries(req.headers)) {
            if (safeHeaderKeys.includes(key.toLowerCase())) {
                allowedHeaders[key] = value;
            }
        }

        // Set User-Agent bawaan jika tidak ada
        if (!allowedHeaders['user-agent']) {
            allowedHeaders['user-agent'] = 'AlightMotion/5.0.0 (Android)';
        }

        const fetchOptions = {
            method: req.method,
            headers: allowedHeaders
        };

        if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
            fetchOptions.body = JSON.stringify(req.body);
            fetchOptions.headers['content-type'] = 'application/json';
        }

        // 3. Panggil API Alight Motion
        const response = await fetch(targetUrl, fetchOptions);
        const responseText = await response.text();
        
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            return res.status(response.status).send(responseText);
        }

        // =========================================================
        // INTERCEPTOR TANGGAL (PAKSA MASA AKTIF HINGGA TAHUN 2099)
        // =========================================================
        if (data && typeof data === 'object') {
            const FAR_FUTURE = "2099-12-31T23:59:59.000Z";

            data.isSubscribed = true;
            data.status = "ACTIVE";
            data.subscriptionType = "PREMIUM";

            if (data.subscriptionEndDate) data.subscriptionEndDate = FAR_FUTURE;
            if (data.expiresAt) data.expiresAt = FAR_FUTURE;
            if (data.expireDate) data.expireDate = FAR_FUTURE;
            if (data.expirationDate) data.expirationDate = FAR_FUTURE;

            if (data.user) {
                data.user.isSubscribed = true;
                data.user.subscriptionEndDate = FAR_FUTURE;
            }
            if (data.account) {
                data.account.isSubscribed = true;
                data.account.expiresAt = FAR_FUTURE;
            }
        }
        // =========================================================

        res.status(response.status).json(data);

    } catch (error) {
        console.error("Netlify Proxy Error:", error);
        res.status(500).json({ 
            error: "Proxy execution error", 
            message: error.message 
        });
    }
});

module.exports.handler = serverless(app);
