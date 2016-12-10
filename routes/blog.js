const router = require('express').Router();
const marked = require('marked');
const fs = require('fs');

/* GET home page. */
router.get('/:postName', function(req, res) {
	const post = req.params.postName;
	const path = __dirname + '/../blog/' + post + '.md';

	const file = fs.readFileSync(path, 'utf8');

	res.render('blog', { title: 'Express', body: marked(file.toString()) });
});

module.exports = router;
