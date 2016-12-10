const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');

function havePost(postName) {
	const blogRoot = appRoot + '/blog/';

	return new Promise(function(resolve, reject) {
		const posts = fs.readdir(blogRoot, function(err, files) {
			const blogPosts = files.map((file) => path.basename(file, '.md'));

			if (blogPosts.includes(postName)) {
				resolve(blogRoot + postName + '.md');
			} else {
				reject('fail');
			}
		});
	});
}

module.exports = { havePost: havePost };