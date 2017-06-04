$(document).ready(function () {
  new Morris.Line({
    // ID of the element in which to draw the chart.
    element: 'myfirstchart',
    // Chart data records -- each entry in this array corresponds to a point on
    // the chart.
    data: [
      { year: '2010', value: 20000 },
      { year: '2011', value: 15000 },
      { year: '2012', value: 16000 },
      { year: '2013', value: 32000 },
      { year: '2014', value: 10000 },
      { year: '2015', value: 50000 },
      { year: '2016', value: 23000 }
    ],
    // The name of the data record attribute that contains x-values.
    xkey: 'year',
    // A list of names of data record attributes that contain y-values.
    ykeys: ['value'],
    // Labels for the ykeys -- will be displayed when you hover over the
    // chart.
    labels: ['Earning $']
  });
})