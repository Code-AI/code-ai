const bluebird = require('bluebird');
const User = require('../models/User');
const request = bluebird.promisifyAll(require('request'), { multiArgs: true });
const cheerio = require('cheerio');
/**
 * GET /
 * Home page.
 */
exports.getPage = (req, res) => {
  console.log('SESSION: ', req.user);
  res.render('code', {
    title: 'Code',
    username: req.user.profile.codeforces_username,
  });
};

exports.getCodeForcesInfo = (req, res, next) => {
  request.get('http://codeforces.com/profile/netman', (err, request, body) => {
    if (err) { return next(err); }
    const $ = cheerio.load(body);
    const links = [];
    $('.title a[href^="http"], a[href^="https"]').each((index, element) => {
      links.push($(element));
    });
    res.render('api/scraping', {
      title: 'Web Scraping',
      links
    });
  });
};

exports.postCodeforcesRegister = (req ,res) => {
	const username = req.body.username;
	const user_id = req.user.id;
	var msg = "";
	console.log(req.body);
	let url = 'http://codeforces.com/api/user.status?handle=';
	var PLEASE_WORK = "lfsadf as dfasdf as df ";
	request.get(url+username, (err, request, response) => {
		console.log(response);
		if (err) { res.end('GOT ERROR'); }
		let data = JSON.parse(response);
		
		
		let good_result = [];
		let result = data.result;
		console.log('RESULT HERE', result);
		for (let i=0; i<result.length; i++) {
			if (result[i].verdict == 'OK') {
				good_result.push({'name': result[i].problem.name, 'url': 'http://codeforces.com/problemset/problem/'+result[i].problem.contestId+'/'+result[i].problem.index});
			}
		}
		PLEASE_WORK = good_result;
		User.findById(user_id, (err, user) => {
			if (err) { return next(err); }
			user.profile.codeforces_username = req.body.username || '';
			user.profile.questions_solved = good_result;
			console.log('SAVING IN DB, ', user.profile.questions_solved);
			user.save((err) => {
				if (err) {
					res.end("SOME OTHER ERROR");
				}
				res.end(good_result);
			});
		});
		res.end('STATUS NOT OK');
	});
	res.end(PLEASE_WORK);
}

exports.getCodeForcesQuestions = (req, res) => {
	let qs;
	User.findById(req.user.id, (err, user) => {
		if (err) { return next(err); }
		qs = user.profile.questions_solved;
		console.log('SAVING IN DB, ', user.profile.questions_solved);
		res.send(qs);
	});
}
	

