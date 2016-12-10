var express = require('express');
var router = express.Router();
const marked = require('marked');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', body: marked('This is _markdown_.') });
});

module.exports = router;
