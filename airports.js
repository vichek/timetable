"use strict";

function main(){

	var requestCounter = 0;
	var flights = [];
	var requestedAirport = 'DME';
	var departingFlights = [];
	var arrivingFlights = [];
	var intervalID;
	
	/**
	* Конструктор объекта авиакомпании.
	*/
	function AirlineObject(code, name){
		this.code = code;
		this.name = name;
	}

	/**
	* Конструктор объекта аэропорта.
	*/
	function AirportObject(code, name, destination){
		this.code = code;
		this.name = name;
		this.destination = destination;
	}

	/**
	* Конструктор объекта воздушного судна.
	*/
	function AircraftObject(code, name){
		this.code = code;
		this.name = name;
	}

	/**
	* Конструктор объекта статуса рейса.
	*/
	function StatusObject(key, status){
		this.key = key;
		this.status = status;
	}

	/**
	* Парсер строки с указанием времени и даты.
	*/
	function parseDate(string){
		var split = string.split('T');
		var date = split[0].split('-');
		var time = split[1].split(':',2);
		return new Date(date[0], date[1], date[2], time[0], time[1]);
	}

	/**
	* Функция сравнения двух строк табло по времени.
	*/
	function compareObjects(object1, object2){
		return object1.scheduledTime - object2.scheduledTime;
	}

	/**
	* Функция сравнения двух строк табло по времени с учётом порядка вылета и прилёта
	*/
	function compareObjectsWithOddity(object1, object2){
		var difference = object1.scheduledTime - object2.scheduledTime;
		if(difference === 0 && object1.departure === object2.departure){
			return object1.arrayIndex - object2.arrayIndex;
		} else {
			return difference;
		}
	}

	/**
	* Конструктор объекта-строки.
	*/
	function RowObject(departure, scheduledTime, flightNumber, logo, airline, destination, flightStatus, aircraft, aircraftShort, comment){
		this.departure = departure;
		this.scheduledTime = scheduledTime;
		this.flightNumber = flightNumber;
		this.logo = logo;
		this.airline = airline;
		this.destination = destination;
		this.flightStatus = flightStatus;
		this.aircraft = aircraft;
		this.aircraftShort = aircraftShort;
		this.comment = comment;
		this.odd = "";
		this.arrayIndex = "";
		this.string = "";
	}

	/**
	* Построение строки HTML.
	*/
	RowObject.prototype.toString=function(){
		var departureIcon = '><td class=\"type\"><img src=\"images/departure.png\" alt=\"Вылет\"></td><td class=\"time\">';
		var arrivalIcon =  '><td class=\"type\"><img src=\"images/arrival.png\" alt=\"Прилёт\"></td><td class=\"time\">';
		var contentString;	
		var stringBegin = '<tr ';
		var stringEnd = "";
		if(this.departure){
			stringBegin +='class=\"depart ';
			if(this.odd){
				stringBegin += 'departOdd\" content=';
			}else{
				stringBegin += 'departEven\" content=';
			}
			stringEnd += departureIcon;
			contentString = "Время вылета:";
		}else{
			stringBegin +='class=\"arrive content=';
			if(this.odd){
				stringBegin +='arriveOdd\" content=';
			}else{
				stringBegin +='arriveEven\" content=';
			}
			stringEnd += arrivalIcon;
			contentString = "Время посадки:";
		}
		var hour = this.scheduledTime.getHours();
		if (hour < 10){
			hour = '0'+hour;
		}
		var minutes = this.scheduledTime.getMinutes();
		if (minutes < 10){
			minutes = '0'+minutes;
		}
		var day = this.scheduledTime.getDate();
		if (day !== currentDate.getDate()){
			var month = this.scheduledTime.getMonth();
			if(month<10){
				month = '0'+month;
			}
			day = ', '+day+'-'+month+'-'+this.scheduledTime.getFullYear();
		}else{
			day = '';
		}
		stringEnd += hour+':'+minutes+day+'</td>';
		contentString += hour+':'+minutes+day+";";
		stringEnd += '</td><td class=\"flightNumber\">'+this.flightNumber+'</td>';
		contentString += "рейс:"+this.flightNumber+";";
		var logoLink = this.logo;
		logoLink = '<img src=\"'+logoLink+'\" alt=\"'+this.airline+'\"  height="20">';
		stringEnd += '</td><td class=\"logo\">'+logoLink+'</td>';
		stringEnd += '</td><td class=\"airline\">'+this.airline+'</td>';
		contentString += "авиакомпания:"+this.airline+";";
		stringEnd += '</td><td class=\"destination\">'+this.destination+'</td>';
		contentString += "пункт_назначения:"+this.destination+";";
		stringEnd += '</td><td class=\"status\">'+this.flightStatus+'</td>';
		contentString += "статус:"+this.flightStatus+";";
		stringEnd += '</td><td class=\"aircraft\">'+this.aircraft+'</td>';
		contentString += "воздушное_судно:"+this.aircraft.charAt(0)+'-'+this.aircraftShort;
		stringEnd += '</td><td class=\"aircraftShort\">'+this.aircraft.charAt(0)+'-'+this.aircraftShort+'</td>';
		stringEnd += '</td><td class=\"comment\">'+this.comment+'</td></tr>';
		if(this.comment.length>0){
				contentString += ";"+"примечания:"+this.comment;
		}
		var content = contentString.split(' ');
		contentString = '';
		content.forEach(function(item,i){
			contentString += item;
			if(i<content.length-1){
				contentString+="_";
			}
		});
		this.string = stringBegin+contentString+stringEnd;
	};

	/**
	* Загрузка строки в таблицу HTML.
	*/
	RowObject.prototype.appendToTable = function(){
		if(this.string){
			var tbody = $('.tableBody');
			var table = tbody.length ? tbody : $('.tableContainer');
			table.append(this.string);
		}else{
			console.log("Строка не создана");		
		}
	};

	function parseRequest(request){
		if(request.flightStatuses[0].arrivalAirportFsCode === requestedAirport){		
			parseData(request, false, arrivingFlights);
		}else if (request.flightStatuses[0].departureAirportFsCode === requestedAirport){
			parseData(request, true, departingFlights);
		}
	}

	/**
	* Обработчик ответа API.
	*/
	function parseData(data, departure, resultingArray){
		var airlinesDictionary = data.appendix.airlines.map(function(item){
			return new AirlineObject(item.fs, item.name);
		});		
		var airportsDictionary = data.appendix.airports.map(function(item){
			return new AirportObject(item.fs, item.name, item.city+', '+item.countryName);
		});
		var aircraftsDictionary = data.appendix.equipments.map(function(item){
			return new AircraftObject(item.iata, item.name);
		});
		var statusesDictionary = [new StatusObject('A', 'в полёте'), new StatusObject('C', 'отменён'), new StatusObject('D', 'изменён пункт назначения'), new StatusObject('DN', ''), 
			new StatusObject('L', 'приземлился'), new StatusObject('R', 'перенаправлен'), new StatusObject('S', 'по расписанию'), new StatusObject('U', '')];
		data.flightStatuses.forEach(function(entry){
			var flightData = parseEntry(entry, departure, airlinesDictionary, airportsDictionary, aircraftsDictionary, statusesDictionary);
			resultingArray.push(flightData);
		});
	}
	
	/**
	* Обработчик данных одного рейса.
	*/
	function parseEntry(entry, departure, airlinesDictionary, airportsDictionary, aircraftsDictionary, statusesDictionary){
		var scheduledTime, destinationCode, logo, comment, delayedTime, codeshares, aircraft;
		var carrier = entry.carrierFsCode;
		var flightNumber = carrier+" "+entry.flightNumber;
		var statuses = statusesDictionary.filter(function(item){
			return item.key === entry.status;
		});
		var flightStatus = statuses[0].status;
		if(departure){
			destinationCode = entry.arrivalAirportFsCode;
			if(entry.operationalTimes.publishedArrival){
				scheduledTime = parseDate(entry.operationalTimes.publishedDeparture.dateLocal);
			}else{
				scheduledTime = parseDate(entry.departureDate.dateLocal);
			}
			if(entry.operationalTimes.estimatedGateDeparture){
				delayedTime = parseDate(entry.operationalTimes.estimatedGateDeparture.dateLocal);
			}else{
				delayedTime = "";
			}
		}else{
			destinationCode = entry.departureAirportFsCode;
			if(entry.operationalTimes.publishedDeparture){
				scheduledTime = parseDate(entry.operationalTimes.publishedArrival.dateLocal);
			}else{
				scheduledTime = parseDate(entry.arrivalDate.dateLocal);
			}
			if(entry.operationalTimes.estimatedGateArrival){
				delayedTime = parseDate(entry.operationalTimes.estimatedGateArrival.dateLocal);
			} else{
				delayedTime = "";
			}
		}
		//Хак логотипов авиакомпаний. При проверке работал всегда.
		logo = "http://d3o54sf0907rz4.cloudfront.net/airline-logos/v2/centered/logos/svg/"+carrier.toLowerCase()+"-logo.svg";
		var airlines = airlinesDictionary.filter(function(item){
			return item.code == carrier;
		});
		var airlineName = airlines[0].name;
		var destinations = airportsDictionary.filter(function(item){
			return item.code == destinationCode;
		}); 
		var destination = destinations[0].destination;
		if(entry.flightEquipment){
			if(entry.flightEquipment.scheduledEquipmentIataCode){
				var aircraftShort = entry.flightEquipment.scheduledEquipmentIataCode;
				var aircrafts = aircraftsDictionary.filter(function(item){
					return item.code == aircraftShort;
				});
				aircraft = aircrafts[0].name;
			}else{
				aircraft = "нет информации";
			}
		}else{
				aircraft = "нет информации";
		}
		comment="";
		if(entry.codeshares){
			comment = "совмещён с ";
			var number = entry.codeshares.length-1; 
			entry.codeshares.forEach(function(item,i){
				comment+=item.fsCode+" "+item.flightNumber;
				if(number>0 && (i!=number)){
					comment+=", ";
				}
			});
		}
		if(entry.delays){
			if(delayedTime.length > 0){
				var time= "вылет задерживается до "+delayedTime.getHours()+":"+delayedTime.getMinutes();
				if(flightStatus.length>0){
					flightStatus+=", "+ time;
				}else{
					flightStatus= time;
				}
			}
		}
		return new RowObject(departure, scheduledTime, flightNumber, logo, airlineName, destination, flightStatus, aircraft, aircraftShort, comment);
	}

	/**
	* Отправка запроса Flight Status API.
	*/
	function getDataFromAPI (myURL){
		$.ajax({
			type: "GET",               
			url: myURL,               
			dataType: "jsonp",
			error: function (response) {
				requestCounter = -3;
				var message = "Ошибка ответа Flight Status";         
				alert(message);
			},
			success: function (response) {
				if(requestCounter>=0){
					requestCounter++;
					parseRequest(response);
				}				
			}
		});
	};


	/**
	* Обработчик двух асинхронных запросов к API.
	*/
	var intervalCalls = function(){
		if(requestCounter === 2){
			clearInterval(intervalID);
			var allFlights = [];
			departingFlights.sort(compareObjects);
			departingFlights.forEach(function (object, i){
				if(i%2===0){
					object.odd=true;
				}else{
					object.odd=false;
				}
				object.arrayIndex = i;
				allFlights.push(object);
			});
			arrivingFlights.sort(compareObjects);
			arrivingFlights.forEach(function (object, i){
				if(i%2===0){
					object.odd=true;
				}else{
					object.odd=false;
				}
				object.arrayIndex = i;
				allFlights.push(object);
			});
			allFlights.sort(compareObjectsWithOddity);
			allFlights.forEach(function(object){
				object.toString();
				object.appendToTable();
			});
		}else if (requestCounter<0){
			clearInterval(intervalID);
		}
	}

	var currentDate = new Date();
	requestedAirport = 'DME';
	var callback ='?appId=ee8d3c48&appKey=b96e69ffe5d4b84272bc7251384b046f&utc=false&numHours=6&maxFlights=100'
	var requestedTime = '/'+currentDate.getFullYear()+'/'+(currentDate.getMonth()+1)+'/'+currentDate.getDate()+'/'+currentDate.getHours();
	var arrivalRequest = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/airport/status/'+requestedAirport+'/arr'+requestedTime+callback;
	var departureRequest = 'https://api.flightstats.com/flex/flightstatus/rest/v2/jsonp/airport/status/'+requestedAirport+'/dep'+requestedTime+callback;
	getDataFromAPI(departureRequest);
	getDataFromAPI(arrivalRequest);
	intervalID = setInterval(intervalCalls, 10000);
}

$(document).ready(main());