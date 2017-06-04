// const WordCloud = require ('wordcloud')
// WordCloud(document.getElementById('tag_from_pdf'), {list:[ ['tenant', 10 ],['Tenant Landlord Tenant', 9 ],
//      ['Landlord Tenant Landlord', 8 ], ['Landlord Tenant Electricity', 7 ]]} );

exports.getUploadAndTag = (req, res) => {
  res.render('upload_and_tag', {
    title: 'Upload and Tag'
  });
};