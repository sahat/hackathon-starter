const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');
const pdf = require('pdfreader');
const _ = require('lodash');

function parseDoc(doc, callback) {
  let text;
  new pdf.PdfReader().parseFileItems(doc, (err, item) => {
    if (!item) {
      return callback(text);
    } else if (item.text) {
      text += item.text;
    }
  });
}
/**
 * GET /search/lawyers
 */
exports.findLawyers = (req, res) => {
  parseDoc('./uploads/ResidentialLease.pdf', (text) => {
    if (text == null) {
      return res.render('search/lawyers', {
        title: 'Lawyers',
        docAnalysis: 'There was a problem with the document, here are some suggestions for lawyers we think you will find useful.',
        searchResult: [
                    { name: 'Jane Doe', rating: 4, exp: 5, gender: 'female', bio: 'Jane Doe graduated from Osgoode Hall Law School in 2009 and has been a member of the Ontario Bar since 2010.' },
                    { name: 'Bob Smith', rating: 3, exp: 6, gender: 'male', bio: 'Bob Smith is a Criminal Lawyer with an office located in Downtown Toronto, close to the criminal courthouses.' },
                    { name: 'Winnie Luk', rating: 5, exp: 2, gender: 'female', bio: 'Winnie J Luk, BA JD MBA, is a seasoned Ontario lawyer practicing in real estate, wills, and corporate law. You always deal directly with her on legal matters. Consultation is available on flexible arrangement to better serve clients.' },
                    { name: 'Joe Smith', rating: 2, exp: 10, gender: 'male', bio: 'Joe Smith\'s Law Office is a small firm dedicated to big results. Our lawyers and paralegals offer services all over Ontario and Quebec.' }
        ]
      });
    }

    const api = new NaturalLanguageUnderstandingV1({
      username: 'ebff7389-e467-4d1d-8bfb-967e47649b14',
      password: '2ZqoGyDpecNu',
      version_date: '2017-02-27'
    });

    const parameters = {
      text,
      features: {
        keywords: {
          limit: 4
        }
      }
    };

    api.analyze(parameters, (err, response) => {
      if (err) {
        console.log('error:', err);
      } else {
        console.log(response);
        const keywords = _.map(response.keywords, key => key.text);
        console.log(keywords);
        res.render('search/lawyers', {
          title: 'Lawyers',
          docAnalysis: keywords,
          searchResult: [
                    { name: 'Jane Doe', rating: 4, exp: 5, gender: 'female', bio: 'Jane Doe graduated from Osgoode Hall Law School in 2009 and has been a member of the Ontario Bar since 2010.' },
                    { name: 'Bob Smith', rating: 3, exp: 6, gender: 'male', bio: 'Bob Smith is a Criminal Lawyer with an office located in Downtown Toronto, close to the criminal courthouses.' },
                    { name: 'Winnie Luk', rating: 5, exp: 2, gender: 'female', bio: 'Winnie J Luk, BA JD MBA, is a seasoned Ontario lawyer practicing in real estate, wills, and corporate law. You always deal directly with her on legal matters. Consultation is available on flexible arrangement to better serve clients.' },
                    { name: 'Joe Smith', rating: 2, exp: 10, gender: 'male', bio: 'Joe Smith\'s Law Office is a small firm dedicated to big results. Our lawyers and paralegals offer services all over Ontario and Quebec.' }
          ]
        });
      }
    });
  });
};

exports.uploadDoc = (req, res) => {
  res.render('search/upload', {
    title: 'Upload a document'
  });
};

exports.postUploadDoc = (req, res) => {
  res.redirect('/search/lawyers');
};
