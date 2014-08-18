var crypto = require('crypto');

if(process.env.WEBHOOK_SECRET_KEY) {
  var secret = process.env.WEBHOOK_SECRET_KEY;
} else {
  throw new Error('Missing WEBHOOK_SECRET_KEY, cannot continue');
}

module.exports = function(req, res, buf, encoding) {
  if(req.path != '/post-hook') {
    return true;
  }

  var checksum = crypto.createHmac('sha1', secret),
      digest;

  checksum.update(buf);

  digest = checksum.digest('hex');

  if(digest != req.headers['HTTP_X_HUB_SIGNATURE']) {
    res.status(400).end();
    throw new Error('Verification failed for payload');
  }
}
