$('.password-field').strengthify({
    zxcvbn: '/js/lib/zxcvbn.js',
    tilesOptions: {
        tooltip: false,
        element: true
    },
    drawTitles: true,
    drawMessage: false,
    drawBars: true
});
