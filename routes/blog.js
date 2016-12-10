const router = require('express').Router();
const appRoot = require('app-root-path');
const marked = require('marked');
const fs = require('fs');
const havePost = require('../lib/blog').havePost;

/* GET home page. */
router.get('/:postName', function(req, res) {
	const post = req.params.postName;
	let file = '';
	let postPath = '';

	havePost(post)
		.then(function(post) {
			file = fs.readFileSync(post, 'utf8');
			res.render('blog', { title: 'Express', body: marked(file.toString()) });
		})
		.catch(function(blogError) {
			const err = new Error('Not Found');
			res.locals.message = err.message;
			res.locals.error = req.app.get('env') === 'development' ? err : {};

			// render the error page
			res.status(err.status || 500);
			res.render('error');
		});
});

module.exports = router;
