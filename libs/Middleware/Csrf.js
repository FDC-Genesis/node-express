const crypto = require('crypto');

class Csrf {
    csrf() {
        return (req, res, next) => {
            let token;
            if (!req.cookies._csrf) {
                token = this.csrfToken();
                res.cookie('_csrf', token, {
                    httpOnly: true,
                    maxAge: 600000,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Lax',
                });
            } else {
                token = req.cookies._csrf;
            }

            res.locals.csrfToken = token;
            res.locals.csrf = () => `<input type="hidden" name="_csrf" value="${token}">`;

            if (req.method === 'POST') {
                if (req.body._csrf !== req.cookies._csrf) {
                    return res.status(403).send('Invalid CSRF token');
                }
                res.cookie('_csrf', '', { expires: new Date(0) });
            }

            next();
        };
    }

    // Generate a new CSRF token
    csrfToken() {
        const randomBytes = crypto.randomBytes(12).toString('hex');
        const hash = crypto.createHash('sha1').update(randomBytes).digest('hex');
        return hash;
    }
}

module.exports = new Csrf().csrf();
