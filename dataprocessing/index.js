var fs = require('fs');
var csv = require("fast-csv");
var googleMapsClient = require('@google/maps').createClient({
  key: 'your google map api KEY'
});
var jsonfile = require('jsonfile');
var file = 'you_Can_Stored_The_Full_JSONFile.json';

var stream = fs.createReadStream("the_input_file.csv", {encoding:'utf-8',bufferSize:11});	//houseAddress.csv city-houseValue.csv
var houseData = [];		//two dimension
var rowCounter = 0; 	//To count the numbers of row
var houseObject = {};
var latlngString = '';
var jsonArray = [];


csv
 .fromStream(stream)
 .on("data", function(data){
 	houseData[rowCounter] = [];
 	for (var i = 0; i < data.length; i++) {
 		houseData[rowCounter][i] = data[i];
 	}
    rowCounter ++;
 })
 .on("end", function(){
     console.log("done");

     callMultipleTimes( houseData, tryingToOutputCSV );

     console.log(rowCounter);
 });

var geocodeInputObject = {
	address:'',
	language: 'zh-TW'
}
var reverseGeocodeInputObject = {
	latlng:'',
	language: 'zh-TW'
}

var csvStream = csv.createWriteStream({headers: true}),
writableStream = fs.createWriteStream("the_output_file.csv", {defaultEncoding: 'utf8'});


function getAddress( inputAdress, callbackFunction ){
	geocodeInputObject.address = inputAdress;
	var str;
	googleMapsClient.geocode(geocodeInputObject, function(err, response){
		if( response.json.results[0] ){
			str = response.json.results[0].geometry.location.lat;
			str += ',';
			str += response.json.results[0].geometry.location.lng;

		}
		else{			//if undefined give the assigned latlng
			str = "25.0265985,121.4178347";	//assign the
		}
		callbackFunction( str );
	});
}

function getMoreInfomation( inputAdress_array, callbackFunction ){
	var inputAdress = inputAdress_array[2];
	getAddress( inputAdress, function( output ){		//input the origin address #testString
		//console.log(output);
		reverseGeocodeInputObject.latlng = output;
		googleMapsClient.reverseGeocode( reverseGeocodeInputObject, function(err, response){
			if (!err) {
				//callbackFunction( response.json.results[0].address_components );
				//resultArray.push( response.json.results[0] );
				callbackFunction( inputAdress_array, response.json.results[0] );
			}
			else{
				console.log("can't get info");
			}
		});
	});
}

function outputTheResult(output){
	var file = 'data.json';

	console.log(output);

	jsonfile.writeFile(file, output, function (err) {
	  console.error(err);
	})
}

function callMultipleTimes( array, callbackFunction ){
	csvStream.pipe(writableStream);			//must be here
	for( var i=0; i<=rowCounter; i++ ){
		getMoreInfomation( array[i], function( addr_array, output ){

			callbackFunction(addr_array, output);
		});
	}
	
}

function callingIt( output ){
	console.log(output);
}

function tryingToOutputCSV(orginArray, output){
	//csvStream.pipe(writableStream);
	var address_components = output.address_components;
	var level4;

	for (var i = 0; i < address_components.length; i++) {
		if( address_components[i].types[0] == "administrative_area_level_4" )
			level4 = address_components[i].long_name;
	}
	//if(  )
	var correctOputting = {		//對應input房價資料的原欄位+新的欄位
		年月: orginArray[0],
		房屋類型: orginArray[1], 
		地址: orginArray[2],
		屋齡: orginArray[3],
		格局: orginArray[4],
		出售樓層_總樓層: orginArray[5],
		建物坪數: orginArray[6],
		土地坪數: orginArray[7],
		車位坪數: orginArray[8],
		車位總價: orginArray[9],
		每坪單價: orginArray[10],
		成交總價: orginArray[11],
		googleAPI_return_Address: output.formatted_address, 
		lat: output.geometry.location.lat, 
		lng: output.geometry.location.lng, 
		street: level4
	};

	if( correctOputting.googleAPI_return_Address == "242台灣新北市新莊區富國路2號" ){
		correctOputting.googleAPI_return_Address = "找不到位址";
		correctOputting.lat = "無";
		correctOputting.lng = "無";
		correctOputting.street = "無";
	}


	//csvStream.write({ Test: orginArray[1], orgin: orginArray[2], googleAPI_return_Address: output.formatted_address, lat: output.geometry.location.lat, lng: output.geometry.location.lng, street: level4 });
	csvStream.write(correctOputting);

	output.orgin = orginArray[2];
	
	jsonfile.writeFile(file, output, {flag: 'a'}, function (err) {
	  //console.error(err)
	})
}

function getRowObject(array, output){
	var infoArray = [];
}

function writingFile( callbackFunction ){
	var infoArray = [];
	getMoreInfomation(function( output ){	//the output is the object from reverse geocode( the address info )
		infoArray.push(output.formatted_address);
		infoArray.push(houseData[6]);
		infoArray.push(output.geometry.location.lat);
		infoArray.push(output.geometry.location.lng);

		callbackFunction( infoArray );
	});
}

function writeCSV( writedInfo ){	//array
	var csvStream = csv.createWriteStream({headers: true}),
    writableStream = fs.createWriteStream("testAddress2.csv", {defaultEncoding: 'utf8'});

    csvStream.pipe(writableStream);
    csvStream.write({googleAPI_return_Address: writedInfo[0], 原地址: writedInfo[1], lat: writedInfo[2], lng: writedInfo[3] });
    csvStream.end();
}





