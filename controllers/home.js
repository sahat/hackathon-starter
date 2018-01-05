/**
 * GET /
 * Home page.
 */

const request = require('request');
const Parking = require('../models/Parking.js');
const Velo = require('../models/Velo.js');

sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.index = (req, res, next) => {
        request('https://geoservices.grand-nancy.org/arcgis/rest/services/public/VOIRIE_Parking/MapServer/0/query?where=1%3D1&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=*&returnGeometry=true&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=4326&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson',
        function (error, response, body) {
            if (!error && response.statusCode === 200) {

                var infoPark = JSON.parse(body);

                infoPark.features.forEach(function (park) {
                    var oldPark
                    Parking.find({"id" : park.attributes.ID}, function (err, docs) {
                        oldPark =docs;


                        if(oldPark.length === 0){

                            var newPark = new Parking(
                                {

                                    name: park.attributes.NOM,
                                    places:  park.attributes.PLACES,
                                    complet:  park.attributes.COMPLET,
                                    ferme:  park.attributes.FERME,
                                    ouvert:  park.attributes.OUVERT,
                                    capacite:  park.attributes.CAPACITE,
                                    id:  park.attributes.ID,
                                    adresse:  park.attributes.ADRESSE,
                                    date_maj:  park.attributes.DATE_MAJ,
                                    taux_occup : park.attributes.TAUX_OCCUP,
                                    taux_dispo: park.attributes.TAUX_DISPO,
                                    lien:  park.attributes.LIEN,
                                    latitude: park.geometry.y,
                                    longitude: park.geometry.x,
                                });
                            newPark.save(function (err) {
                                if (err) return handleError(err);

                            })
                        }
                        else if(oldPark[0].date_maj !== park.attributes.DATE_MAJ )
                        {
                            oldPark[0].places= park.attributes.PLACES;
                            oldPark[0].complet=  park.attributes.COMPLET;
                            oldPark[0].ferme=  park.attributes.FERME;
                            oldPark[0].ouvert=  park.attributes.OUVERT;
                            oldPark[0].date_maj=  park.attributes.DATE_MAJ;
                            oldPark[0].taux_occup= park.attributes.TAUX_OCCUP;
                            oldPark[0].taux_dispo= park.attributes.TAUX_DISPO;

                            oldPark[0].save();
                        }
                    });



                })
                 //deuxième requette pour appel pour les vélos
                request('https://api.jcdecaux.com/vls/v1/stations?contract=Nancy&apiKey=75dd6bfb840e056f04fc5a4803c7e42f8f01bd46',
                    function (error, response, body) {

                        if (!error && response.statusCode === 200) {
                            var infoVelo = JSON.parse(body);


                            infoVelo.forEach(function (velo) {

                                var tableauVeloExistant = [];

                                Velo.find({"number": velo.number}, function (err, docs) {
                                    tableauVeloExistant = docs;

                                    if (tableauVeloExistant.length === 0) {

                                        var newVelo = new Velo(
                                            {
                                                number: velo.number,
                                                name: velo.name,
                                                adress: velo.adress,
                                                latitude: velo.position.lat,
                                                longitude: velo.position.lng,
                                                banking: velo.banking,
                                                bonus: velo.bonus,
                                                status: velo.status,
                                                contract_name: velo.contratc_name,
                                                bike_stands: velo.bike_stands,
                                                available_bike_stands: velo.available_bike_stands,
                                                available_bikes: velo.available_bikes,
                                                last_update: velo.last_update,
                                            });
                                        newVelo.save(function (err) {
                                            if (err) return handleError(err);

                                        })
                                    }
                                    else if (tableauVeloExistant[0].last_update !== velo.last_update) {
                                        tableauVeloExistant[0].status = velo.status;
                                        tableauVeloExistant[0].bike_stands = velo.bike_stands;
                                        tableauVeloExistant[0].available_bike_stands = velo.available_bikes_stands;
                                        tableauVeloExistant[0].available_bikes = velo.available_bikes;
                                        tableauVeloExistant[0].last_update = velo.last_update;

                                        tableauVeloExistant[0].save();
                                    }
                                })

                            });

                            Parking.find((err, docs1) => {
// pour les vélos : j'ai un soucis du à l'Asynchronisme de mon code.. ce n'est que au deuxième chargement que je recois mes valeurs dans docs
                                Velo.find((err, docs) => {
                                console.log("ICI CEST les parking : ", docs1)
                            res.render('home', {
                                title: 'Home',
                                allVelo: docs,
                                allPark: docs1
                            });
                        });

                        });
                        } else {
                            console.log(error);
                        }


                    });



            }else{
                console.log(error);
            }
        });



};

