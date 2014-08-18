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
      digest,
      signature = req.headers['X-Hub-Signature'];

  checksum.update(buf);

  digest = checksum.digest('hex');

  if(digest != signature) {
    res.status(400).end();
    console.log('digest', digest);
    console.log('signature', signature);
    throw new Error('Verification failed for payload');
  }
}
