/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
  console.log('SESSION: ', req.session);
  res.render('home', {
    title: 'Home'
  });
};
