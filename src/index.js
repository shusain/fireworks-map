import htmlString from './data_file.js'

let parser = new DOMParser();
let parsedHtml = parser.parseFromString(htmlString, 'text/html');
let directionsService
let directionsRenderer
let gMap;
let homeAddressElem = document.getElementById('homeAddress');
let mapElem = document.getElementById('map');
const YEAR = 2023;
const TARGET_DATE = 4;
const TARGET_MONTH = 6; // 0 indexed

function parseEvents() {
  let eventWrappers = parsedHtml.querySelectorAll('h3.event-link-wrapper')
  return Array.from(eventWrappers).map(eventLinkWrapper => {
    let eventName = eventLinkWrapper.textContent.trim();
    let eventLink = eventLinkWrapper.querySelector('a')

    // Just handling if no link found going to skip trying to parse this block
    if (!eventLink) {
      return null
    }
    let eventURL = eventLink.href;

    let siblings = []
    let siblingElem = eventLinkWrapper.nextElementSibling
    while (siblingElem) {
      siblings.push(siblingElem.innerText.trim())
      siblingElem = siblingElem.nextElementSibling
    }

    // If we didn't find a "full set" of data just going to skip on the parsing the block as well
    if (siblings.length < 5) {
      return null
    }

    return {
      name: eventName,
      url: eventURL,
      date: siblings[0],
      time: siblings[1],
      location: siblings[2],
      address1: siblings[3],
      address2: siblings[4]
    };
  })
    // Remove anything we couldn't parse and ended up null
    .filter(datum => datum != null)
    // Remove anything that isn't specifically after the 3rd and before the 5th of July
    .filter(datum => {
      return new Date(YEAR, TARGET_MONTH, TARGET_DATE - 1) < new Date(datum.date + ' ' + YEAR) && new Date(datum.date + ' ' + YEAR) < new Date(YEAR, TARGET_MONTH, TARGET_DATE + 1)
    })

}

function geocodeAddress(address, callback) {
  fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.API_KEY}`)
    .then(response => response.json())
    .then(data => {
      if (data.status === "OK") {
        callback(null, data.results[0].geometry.location);
      } else {
        callback(data.status);
      }
    })
    .catch(callback);
}

function calculateAndDisplayRoute(start, end) {
  directionsService.route(
    {
      origin: start,
      destination: end,
      travelMode: 'DRIVING'
    },
    function (response, status) {
      if (status === 'OK') {
        directionsRenderer.setDirections(response);
        let distance = response.routes[0].legs[0].distance.text;
        let duration = response.routes[0].legs[0].duration.text;
        document.getElementById('distanceAndDuration').innerHTML = `Distance: ${distance}, Duration: ${duration}`
        console.log(`Distance: ${distance}, Duration: ${duration}`);
      } else {
        console.error('Directions request failed due to ' + status);
      }
    }
  );
}

globalThis.initMap = function () {
  gMap = new google.maps.Map(mapElem, {
    center: { lat: 41.8781, lng: -87.6298 },
    zoom: 8
  });

  // Adding directions service
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(gMap);

  let events = parseEvents()

  for (let i = 0; i < events.length; i++) {
    let eventData = events[i];
    const { name, location: evtLocation, date, time, url, address1, address2 } = eventData
    let end = `${address1}, ${address2}`;
    geocodeAddress(end, function (error, location) {
      if (error) {
        console.error(error);
      } else {
        // console.log(location);  // { lat: 37.4224764, lng: -122.0842499 }
        let marker = new google.maps.Marker({
          position: location,
          map: gMap,
          title: eventData.name
        });
        (function (marker) {
          google.maps.event.addListener(marker, 'click', function (e) {
            let start = homeAddressElem.value;
            calculateAndDisplayRoute(start, end);
            let gmapsDirectionsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(end)}&travelmode=driving`;

            let infoWindow = new google.maps.InfoWindow({
              content: `<h3>${name}</h3><p>${evtLocation}:${address1}, ${address2}</p><p>${date}</p><p>${time}</p><a href="${url}">Link</a><br/><a target="_blank" href="${gmapsDirectionsLink}">Google Maps</a>`
            });
            infoWindow.open(gMap, marker);
          });
        })(marker);
      }
    })
  }
}
