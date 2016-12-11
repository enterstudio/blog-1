const router = require('express').Router();
const appRoot = require('app-root-path');
const marked = require('marked');
const fs = require('fs');
const havePost = require('../lib/blog').havePost;

/* GET single post. */
router.get('/:postName', function(req, res, next) {
	const post = req.params.postName;
	let file = '';
	let postPath = '';

	havePost(post)
		.then((post) => {
			file = fs.readFileSync(post, 'utf8');
			res.render('blog', { title: 'Express', body: marked(file.toString()) });
		})
		.catch((blogError) => {
			const err = new Error('Post not found');
			err.status = 404;
			next(err);
		});
});

/* GET blog index page. */
router.get('/', function(req, res, next) {
	res.render('blog', { title: 'Blog post list', body: marked('This is _markdown_.') });
});

module.exports = router;
