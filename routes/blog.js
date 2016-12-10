const express = require('express');
const router = express.Router();
const marked = require('marked');
const fs = require('fs');

/* GET home page. */
router.get('/', function(req, res) {
	const path = __dirname + '/../blog/sass-config-theming.md';
	const file = fs.readFileSync(path, 'utf8');

	res.render('blog', { title: 'Express', body: marked(file.toString()) });
});

module.exports = router;
