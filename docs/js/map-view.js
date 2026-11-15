// Written with the assistance of Claude (Anthropic) for NASA Space Apps 2026.
// Map view: real EIC frame image + canvas overlay (glows, flashes, Explore cursor) + geography helpers.
(function () {
  'use strict';
  const EBE = window.EBE = window.EBE || {};
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const RAD = Math.PI / 180;

  // ---------- geography ----------
  function haversineKm(lat1, lon1, lat2, lon2) {
    const dLat = (lat2 - lat1) * RAD, dLon = (lon2 - lon1) * RAD;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.sin(dLon / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  }
  function bearing(lat1, lon1, lat2, lon2) {
    const y = Math.sin((lon2 - lon1) * RAD) * Math.cos(lat2 * RAD);
    const x = Math.cos(lat1 * RAD) * Math.sin(lat2 * RAD) - Math.sin(lat1 * RAD) * Math.cos(lat2 * RAD) * Math.cos((lon2 - lon1) * RAD);
    return Math.atan2(y, x); // radians, 0 = north, clockwise
  }
  function dir8(rad) {
    const k = Math.round(((rad / RAD) + 360) % 360 / 45) % 8;
    return EBE.i18n.t('dir.' + ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'][k]);
  }

  // Coarse named regions (first match wins). [lonMin, lonMax, latMin, latMax, en, es]
  const LAND = [
    [-65.2, -61.7, -30.4, -25.6, 'Santiago del Estero, Argentina', 'Santiago del Estero, Argentina'],
    [-66, -57, -28, -18, 'the Gran Chaco', 'el Gran Chaco'],
    [-75, -48, -15, 5, 'the Amazon', 'la Amazonia'],
    [-74, -53, -56, -22, 'Argentina', 'Argentina'],
    [-82, -34, -56, 13, 'South America', 'Sudamérica'],
    [-92, -59, 7, 23, 'Central America and the Caribbean', 'Centroamérica y el Caribe'],
    [-118, -86, 14, 33, 'Mexico', 'México'],
    [-125, -66, 24, 50, 'the United States', 'Estados Unidos'],
    [-170, -129, 51, 72, 'Alaska', 'Alaska'],
    [-141, -52, 42, 84, 'Canada', 'Canadá'],
    [-73, -11, 59, 84, 'Greenland', 'Groenlandia'],
    [-11, 40, 35, 71, 'Europe', 'Europa'],
    [-17, 35, 15, 32, 'the Sahara', 'el Sahara'],
    [-18, 40, 4, 15, 'the Sahel and Central Africa', 'el Sahel y África central'],
    [10, 42, -35, 4, 'southern Africa', 'el sur de África'],
    [-18, 52, -35, 37, 'Africa', 'África'],
    [34, 63, 12, 42, 'the Middle East', 'Medio Oriente'],
    [68, 90, 6, 36, 'India and South Asia', 'India y el sur de Asia'],
    [90, 141, -11, 25, 'Southeast Asia', 'el Sudeste Asiático'],
    [129, 146, 30, 46, 'Japan', 'Japón'],
    [73, 135, 18, 54, 'China and East Asia', 'China y el este de Asia'],
    [60, 180, 50, 78, 'Siberia', 'Siberia'],
    [46, 90, 35, 55, 'Central Asia', 'Asia central'],
    [112, 155, -44, -10, 'Australia', 'Australia'],
    [165, 180, -48, -33, 'New Zealand', 'Nueva Zelanda'],
    [26, 60, 50, 72, 'Russia', 'Rusia']
  ];
  // Land/sea mask on a 1-degree grid (360 x 180 bits, row-major from 90N 180W), derived from the
  // base map of NASA SVS 5113 (navy = ocean). Used only to name places.
  const LAND_MASK_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAAAAE//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH///8eP////gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB////////////+AAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/////////////wAAAAASAAABQdmAAAAPwAAAAAAAAAAAAAAAAAAAAAAAAAGA////j///////+AAAAB//4AAAAAAAAAAP9gAAAAAAAAAAAAAAAAAAAAAAAeH7v//5////////8AAAAB/+AAAAAAAAAAAA/4AAAAAAAAAAAAAAAAAAAAAAdcIJxP/g////////+AAAAAPnAAAAAAAAAAAAB8AAAAAAAAAAAAAAAAAAAAAD/jD////AP////////AAAAACAAAAAAAf4AAAD//+AAAAAAAAAAAAAAAAAAAAAf/9///8AAAf//////AAAAAAAAAAAAH+AAAD////AAAB/uAAAAAAAAAAAAAAPY8AE//8AAAH/////+AAAAAAAAAAAAfAAAAP////AAAA4CAAAAAAAAAAAAAAf/A8e/f/gAAD/////8AAAAAAAAAAAB8ACAP/////+H4APAAAAAAAAAAAAAAA///5/4//4AAD/////wAAAAAAAAAAADwAHl////////8Af+AAAAAwAABAAAAAff/8O4///gAD/////wAAAAAAAAAAAHwAf/////////8///wAAABAAA//8gACAP//h8f//8AB/////4AAAAAAH/gAAA5Afv/////////////8AABAAD////P//3//n/D6/+AB/////gAAAAAB///AAwB/f//////////////////4AP/////////+Hfz4f/AAf///8AAAAAAP///4Mf/////////////////////+AH/////////////4f/4A///8AAAAAAAP///+M///////////////////////8P/////////////wD/+A///wAQYAAAAf////////////////////////////8//////////////g/+8Af//AA/+AAAA///+D///////////////////////BwP/////////////w//gAf/wAAf8AAAD/8//////////////////////////AGD////////////HYB/wAP/wAAHAAAAP///////////////////////////+AAP///////////+Aw2fAAH/AAAAAAAB//H//////////////////////////AAP///////////4AA/gAAD/AAAAAAAB//H//////////////////////3//AAAf///////////wAA/4QAAOAAAAAAAB//n//////////////////////D/8AAAB/7gD///////wAA/44AAAAAAAAAAB//h/////////////////////+DwAAAAAv8AA///////4AB//8AAAAAAAAA4A9/D///////////////////8AAPgAAAAAD8AAP///////AAf/+AAAAAAAAB8AG+n///////////////////wAAfgAAAAAeAAAH///////wAf/+AAAAAAAAA8AO+H///////////////////gAA/gAAAAB4AAAD////////g///gAAAAAAAB+APwH//////////////////+AAB/AAAAAGAAAABf///////z///4AAAAAAAP/APz////////////////////QAB/AAAAAQAAAABf///////x///8AAAAAAAPPA//////////////////////+AA8AAAAAAAAAAAn///////5///8AAAAAAAPfz///////////////////////AA4AAAAAAAAAAAD///////////8AAAAAAAMf3//////////////////////7AAwAAAAAAAAAAAD///////////sAAAAAAAAf///////////////////////7AAAAAAAAAAAAAAB//////////cfAAAAAAAAD///////////////////////7AAAAAAAAAAAAAAAf/////////wfgAAAAAAAf///////////////////////yAAAAAAAAAAAAAAAf/////B///gfgAAAAAAAP///////////////////////iAAAAAAAAAAAAAAAP//////////AgAAAAAAAD//////v/z//////////////iAAAAAAAAAAAAAAAP//////////AAAAAAAAAD/////H//n//////////////AAAAAAAAAAAAAAAAP//////v/+4AAAAAAAAAD//n/+Gf+P/////////////+HgAAAAAAAAAAAAAAf////////wgAAAAAAAAH//zz/+AH/H/////////////8HwAAAAAAAAAAAAAAf////////wAAAAAAAAAH/8N4/8AB/D/////////////QPAAAAAAAAAAAAAAAf////////wAAAAAAAAAH/4M8f/fh/i////////////8AIAAAAAAAAAAAAAAAf///////+AAAAAAAAAAH/gMPfP///x////////////8AMAAAAAAAAAAAAAAAP///////8AAAAAAAAAAP/AMGOP///x///////////fwAMAAAAAAAAAAAAAAAP///////4AAAAAAAAAAH/AAGHP///g//////////+B4AcAAAAAAAAAAAAAAAH///////wAAAAAAAAAAH+AEcHH///4///////////54B4AAAAAAAAAAAAAAAD///////wAAAAAAAAAAB8/+ACD///////////////w8D4AAAAAAAAAAAAAAAD///////wAAAAAAAAAAAz/+AAgM//////////////A8/4AAAAAAAAAAAAAAAB///////gAAAAAAAAAAB//+AAAI//////////////Ax/gAAAAAAAAAAAAAAAAf/////+AAAAAAAAAAAH///AAAB//////////////gH8AAAAAAAAAAAAAAAAAH/////8AAAAAAAAAAAP///4PAB//////////////wDAAAAAAAAAAAAAAAAAAH/////4AAAAAAAAAAAP///+P8///////////////wDAAAAAAAAAAAAAAAAAADf////4AAAAAAAAAAAP/////////////////////wAAAAAAAAAAAAAAAAAAAD///3g4AAAAAAAAAAAf/////////v///////////wAAAAAAAAAAAAAAAAAAAB///gAcAAAAAAAAAAA//////////n///////////wAAAAAAAAAAAAAAAAAAAB3/+AAcAAAAAAAAAAD///////9//j///////////gAAAAAAAAAAAAAAAAAAAA7/+AAMAAAAAAAAAAD///////8//w3//////////AAAAAAAAAAAAAAAAAAAAAZ/+AAMAAAAAAAAAAH///////+f/8b//////////AAAAAAAAAAAAAAAAAAAAAM/+AAAgAAAAAAAAAP////////f//4Af///////+wAAAAAAAAAAAAAAAAAAAAGf+AAAAAAAAAAAAAP////////P//+AP///////8wAAAAAAAAAAAAAAAAAAAAAP+AB/AAAAAAAAAAf////////n///AH///////ggAAAAAAAAAAAAAAAAAAAAAP+A4DwAAAAAAAAAf////////n///AH///P//+AAAAAAAAAAAAAAAAAAAAAAAP+B4A8AAAAAAAAAf////////3//+AAf/4P/+IAAAAAAAAAAAAAAAgAAAAAAAP/B4AB4AAAAAAAAf////////z//8AAf/wH/8YAAAAAAAAAAAAAAAAAAAAAAAD/3wAj9AAAAAAAAP////////x//4AAf/AD/8QAwAAAAAAAAAAAAAAAAAAAAAAf/wAAAAAAAAAAAP////////4//wAAf+AD/+AA4AAAAAAAAAAAAAAAAAAAAAAH/wAAAAAAAAAAAf////////8//AAAf8AD//AA4AAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAAAAf////////8/8AAAP4AAf/gAwAAAAAAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAf/////////fwAAAPwAAP/gA4AAAAAAAAAAAAAAAAAAAAAAAB/gAAAAAAAAAAf//////////AAAAP4AAP/wA8AAAAAAAAAAAAAAAAAAAAAAAAPgAgAAAAAAAAf/////////4AAAAH4AAN/wAXAAAAAAAAAAAAAAAAAAAAAAAAHgD4AAAAAAAAP/////////w4AAAHwAAMfwALAAAAAAAAAAAAAAAAAAAAAAAADgP/eAAAAAAAH//////////4AAADwAAMfAAOAAAAAAAAAAAAAAAAAAAAAAAABzP/+AAAAAAAD//////////4AAADoAAMGACPAAAAAAAAAAAAAAAAAAAAAAAAA////gAAAAAAD//////////4AAADIAAMAAAHgAAAAAAAAAAAAAAAAAAAAAAAAN///wAAAAAAB//////////wAAAAMAAGAAAPgAAAAAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAf/////////wAAAAMAADAAMDAAAAAAAAAAAAAAAAAAAAAAAAAA////wAAAAAAP/h///////gAAAAAABjgAeAAAAAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAHAB///////AAAAAAAB7wA+AAAAAAAAAAAAAAAAAAAAAAAAAAA////4AAAAAAAAAP//////AAAAAAAAdwB8AAAAAAAAAAAAAAAAAAAAAAAAAAB////8AAAAAAAAAD/////+AAAAAAAAPwH8AAAAAAAAAAAAAAAAAAAAAAAAAAB////8AAAAAAAAAH/////4AAAAAAAAHwf+CYAAAAAAAAAAAAAAAAAAAAAAAAD////8AAAAAAAAAH/////wAAAAAAAAHwf8+YAAAAAAAAAAAAAAAAAAAAAACAH/////gAAAAAAAAH///z/gAAAAAAAADwf9oDwAAAAAAAAAAAAAAAAAAAAAAAH/////8AAAAAAAAH///3/AAAAAAAAAD4P54B5gAAAAAAAAAAAAAAAAAAAAAAH//////AAAAAAAAH////+AAAAAAAAAB+P5wA78AAAAAAAAAAAAAAAAAAAAAAH//////4AAAAAAAD////8AAAAAAAAAA8D54O//gAAAAAAAAAAAAAAAAAAAAAH//////+AAAAAAAB////8AAAAAAAAAAcAB4AH/wYAAAAAAAAAAAAAAAAAAAAH///////gAAAAAAB////4AAAAAAAAAAMABIAB/5wAAAAAAAAAAAAAAAAAAAAH///////gAAAAAAA////8AAAAAAAAAAH8AAAI/9hAAAAAAAAAAAAAAAAAAAAD///////gAAAAAAA////8AAAAAAAAAAB/AAAA/8AAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///8AAAAAAAAAAAPuxgA/OAAAAAAAAAAAAAAAAAAAAAB///////gAAAAAAAf///8AAAAAAAAAAAABDAAEHACAAAAAAAAAAAAAAAAAAAA///////AAAAAAAAf///+AAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAA//////+AAAAAAAAf///+AAAAAAAAAAAAAADwCAAAAAAAAAAAAAAAAAAAAAAAf/////8AAAAAAAAf///8AQAAAAAAAAAAAAD+DAAAAAAAAAAAAAAAAAAAAAAAf/////4AAAAAAAA////+AwAAAAAAAAAAAAD8HAAAAAAAAAAAAAAAAAAAAAAAP/////4AAAAAAAA////+AwAAAAAAAAAAAB38DgAAAAAAAAAAAAAAAAAAAAAAH/////4AAAAAAAA////+H4AAAAAAAAAAAD/+DwAACAAAAAAAAAAAAAAAAAAAD/////4AAAAAAAB////8PwAAAAAAAAAAAH//nwAAAABAAAAAAAAAAAAAAAAAA/////4AAAAAAAB////wPwAAAAAAAAAAAP///wAAAACAAAAAAAAAAAAAAAAAAf////4AAAAAAAA////gPwAAAAAAAAAAAP///4AAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAA////APgAAAAAAAAAAA////8AAAAAAAAAAAAAAAAAAAAAAAf////wAAAAAAAAf//+APgAAAAAAAAAAP////+AAAAAAAAAAAAAAAAAAAAAAAf////gAAAAAAAAf///APgAAAAAAAAAAf/////AAGAAAAAAAAAAAAAAAAAAAAf////gAAAAAAAAP///AfAAAAAAAAAAB//////gACAAAAAAAAAAAAAAAAAAAAf///8AAAAAAAAAP///AfAAAAAAAAAAB//////gAAAAAAAAAAAAAAAAAAAAAAf///gAAAAAAAAAP//+AfAAAAAAAAAAB//////wAAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//8AMAAAAAAAAAAA//////4AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AAAAAAAAAAAAB//////4AAAAAAAAAAAAAAAAAAAAAAf///AAAAAAAAAAH//4AAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAA///+AAAAAAAAAAD//wAAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAA///+AAAAAAAAAAB//wAAAAAAAAAAAAAf/////8AAAAAAAAAAAAAAAAAAAAAA///8AAAAAAAAAAB//gAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///4AAAAAAAAAAA//AAAAAAAAAAAAAAf/////4AAAAAAAAAAAAAAAAAAAAAA///wAAAAAAAAAAA/+AAAAAAAAAAAAAAf/wf//4AAAAAAAAAAAAAAAAAAAAAA///gAAAAAAAAAAA/8AAAAAAAAAAAAAAf8AP//wAAAAAAAAAAAAAAAAAAAAAA///AAAAAAAAAAAAcAAAAAAAAAAAAAAAfAAF//gAAAAAAAAAAAAAAAAAAAAAB//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//gAABgAAAAAAAAAAAAAAAAAB//8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf/AAAAgAAAAAAAAAAAAAAAAAD//4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAA4AAAAAAAAAAAAAAAAAD//wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAA+AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8AAAAAAAAAAAAAAAAAD/8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAHwAAAAAAAAAAAAAAAAAD/4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAcAAAHAAAAAAAAAAAAAAAAAAD/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAeAAAAAAAAAAAAAAAAAAH/gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8AAAAAAAAAAAAAAAAAAH+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAP+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP+AAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH4BwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB/gAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAP4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAfgAAAAAAAAAAAAAAAAABgAAAAAB/4CAAAMAAAAAAAAAAAAAAAAAAAAAAAAAB/AAAAAAAAAAAAAAAAAAP4AAAD/////4/3/4AAAAAAAAAAAAAAAAAAAAAAAAH/AAAAAAAAAAAAAAAAAH///kAH//////////4AAAAAAAAAAAAAAAAAAAAAAAT/gAAAAAAAAAAAAAAGD/////A////////////+AAAAAAAAAAAAAAAAAAAAAP//AAAAAAAAABgAfAD/////////////////////8AAAAAAAAAAAAAAAAAAAAH//AAAAAAAAP////////////////////////////+AAAAAAAAAAAAAAA+AAAP//AAAAAAAD//////////////////////////////4AAAAAAAAAAAAAB//4A1//AAAAAAB///////////////////////////////4AAAAAAAAAB+ADB///////AAAAAAH///////////////////////////////wAAAAAAABf////4//////+AAAAAA///////////////////////////////8AAAAAAAD//////////////wAAAAH///////////////////////////////wAAAAAAD////////////////gAAB////////////////////////////////gAAAAA///////////////////x+///////////////////////////////////8////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////';
  let landMask = null;
  function isLand(lon, lat) {
    if (!landMask) { const bin = atob(LAND_MASK_B64); landMask = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) landMask[i] = bin.charCodeAt(i); }
    const i = clamp(Math.floor(lon + 180), 0, 359), j = clamp(Math.floor(90 - lat), 0, 179);
    const k = j * 360 + i;
    return (landMask[k >> 3] >> (7 - (k & 7))) & 1;
  }

  // Longitude of the Americas that separates the Pacific (west) from the Atlantic (east), by latitude.
  function pacificBoundary(lat) {
    if (lat < -18) return -70;
    if (lat < 8) return -78;
    if (lat < 20) return -78 - (lat - 8) * 2.25;
    if (lat < 32) return -105 - (lat - 20) * 0.8;
    return -100;
  }

  function oceanName(lon, lat) {   // [en, es]
    if (lat < -60) return ['the Southern Ocean', 'el océano Austral'];
    if (lat > 66) return ['the Arctic Ocean', 'el océano Ártico'];
    if (lon >= -6 && lon <= 42 && lat >= 30 && lat <= 47) return ['the Mediterranean and Black Sea', 'el Mediterráneo y el mar Negro'];
    if (lon >= 45 && lon <= 56 && lat >= 36 && lat <= 48) return ['the Caspian Sea', 'el mar Caspio'];
    const pb = pacificBoundary(lat);
    if (lon > pb && lon < -60 && lat >= 9 && lat <= 31) return ['the Caribbean and Gulf of Mexico', 'el Caribe y el golfo de México'];
    if (lon > pb && lon < (lat >= 30 ? 45 : 20)) return lat >= 0 ? ['the North Atlantic', 'el Atlántico Norte'] : ['the South Atlantic', 'el Atlántico Sur'];
    if (lon >= 20 && lon < 100 && lat < 31) return ['the Indian Ocean', 'el océano Índico'];
    if (lon >= 100 && lon < 147 && lat < -10) return ['the Indian Ocean', 'el océano Índico'];
    if (lon >= 100 && lon < 130 && lat >= -10 && lat <= 25) return ['the seas of Southeast Asia', 'los mares del Sudeste Asiático'];
    if (Math.abs(lat) <= 6) return ['the equatorial Pacific', 'el Pacífico ecuatorial'];
    return lat >= 0 ? ['the North Pacific', 'el Pacífico Norte'] : ['the South Pacific', 'el Pacífico Sur'];
  }

  function coords(lon, lat) {
    const la = Math.abs(lat).toFixed(0) + '°' + (lat >= 0 ? 'N' : 'S');
    const lo = Math.abs(lon).toFixed(0) + '°' + (lon >= 0 ? 'E' : (EBE.i18n.getLang() === 'es' ? 'O' : 'W'));
    return la + ' ' + lo;
  }

  // "near the Amazon (5°S 60°W)" on land, "in the equatorial Pacific (2°S 100°W)" at sea.
  // forceLand: for fires, which are always on land even in coastal cells.
  function placeName(lon, lat, forceLand) {
    const es = EBE.i18n.getLang() === 'es';
    if (forceLand || isLand(lon, lat)) {
      if (lat < -60) return (es ? 'en la Antártida' : 'in Antarctica') + ' (' + coords(lon, lat) + ')';
      for (const r of LAND) {
        if (lon >= r[0] && lon <= r[1] && lat >= r[2] && lat <= r[3]) {
          return EBE.i18n.t('common.near', { place: es ? r[5] : r[4] }) + ' (' + coords(lon, lat) + ')';
        }
      }
      return coords(lon, lat);
    }
    const o = oceanName(lon, lat);
    return EBE.i18n.t('common.inSea', { place: es ? o[1] : o[0] }) + ' (' + coords(lon, lat) + ')';
  }


  // ---------- continents and oceans (spoken in blind mode) ----------
  // Coarse rules on top of the 1-degree land mask. The Americas are split in three:
  // North (with Mexico and Greenland), Central (Guatemala to Panama, plus the Caribbean islands) and South.
  function continentKey(lon, lat) {
    if (lat < -60) return 'antarctica';
    if ((lon < -125 && lat < 28) || (lon < -100 && lat < -10)) return 'oceania';      // Hawaii, Polynesia
    if (lon < -168.5 && lat > 64) return 'asia';                                       // Chukotka, across 180°
    if (lon > -32 && lon < -24 && lat > 36 && lat < 40.5) return 'europe';             // Azores
    if (lat > 59 && lon > -75 && lon < -10) return (lat < 67.5 && lon > -26) ? 'europe' : 'northAmerica';  // Iceland / Greenland
    if (lon < -30) {
      if (lat < 7) return 'southAmerica';
      if (lat < 12.6 && lon > -77.3) return (lon > -63 && lat >= 11.2) ? 'centralAmerica' : 'southAmerica';
      if ((lat < 16 && lon > -92.3) || (lat < 17.9 && lon > -90.5) || (lat < 18.6 && lon > -89.3 && lon < -87.4)) return 'centralAmerica';
      if (lat < 23.6 && lon > -85.2 && lon < -59) return 'centralAmerica';            // Caribbean islands
      return 'northAmerica';
    }
    if (lon > 172 && lat > 50) return 'northAmerica';                                  // western Aleutians
    // Africa: south of the Mediterranean, west of the Red Sea, Madagascar and nearby islands.
    if (lon < 60 && lat < 37.5 && lat > -40) {
      if (lat < 12) return 'africa';
      if (lat <= 29.9) { if (lon < 32.6 + (29.9 - lat) * 0.624) return 'africa'; }
      else if (lon < 34.2 && lat < (lon < -1 ? 36.0 : lon < 12 ? 37.4 : 34.5)) return 'africa';
    }
    // Europe / Asia: Ural mountains and river, Caspian, Caucasus, Black Sea and Bosporus.
    if (lat > 34 && lon < 70) {
      if (lon < 26) return 'europe';
      if (lon < 29.2) return lat > 40.4 ? 'europe' : 'asia';
      if (lat >= 52) return lon < (lat >= 67 ? 66 : 60) ? 'europe' : 'asia';
      if (lat >= 47) return lon < 51.5 + (lat - 47) * 1.4 ? 'europe' : 'asia';
      if (lon < 40) return lat > 42.3 ? 'europe' : 'asia';
      if (lon < 49.6) return lat > 43.4 - (lon - 40) * 0.25 ? 'europe' : 'asia';
      return 'asia';
    }
    if (lon >= 110 && lat < -10.5) return 'oceania';                                   // Australia, New Zealand
    if (lon > 130.8 && lat < 0) return 'oceania';                                      // New Guinea, Melanesia
    if (lon > 133 && lat < 23) return 'oceania';                                       // Micronesia
    return 'asia';
  }

  function seaKey(lon, lat) {
    if (lat < -60) return 'southern';
    if (lat > 66) return 'arctic';
    if (lon >= 27.5 && lon <= 42 && lat >= 40.9 && lat <= 47) return 'blackSea';
    if (lon >= -5.6 && lon <= 37 && lat >= 30 && lat <= 46 && !(lon < 0 && lat > 38)) return 'mediterranean';
    if (lon >= 45 && lon <= 56 && lat >= 36 && lat <= 48) return 'caspian';
    if (lat >= 53.5 && lon <= 30.5 && ((lat <= 60.5 && lon >= 10) || (lon >= 17 && lon <= 25.5))) return 'baltic';
    if (lon >= -96 && lon <= -76 && lat >= 51 && lat <= 66) return 'hudson';
    const pb = pacificBoundary(lat);
    if (lon > pb && lon < -60 && lat >= 9 && lat <= 31) return (lat > 21.5 && lon < -80.5) ? 'gulfMexico' : 'caribbean';
    if (lon > pb && lon < (lat >= 30 ? 45 : 20)) return 'atlantic';
    if (lon >= 20 && lon < 100 && lat < 31) return 'indian';
    if (lon >= 100 && lon < 147 && lat < -10) return 'indian';
    return 'pacific';
  }

  // Key of the continent or ocean under a point, for EBE.i18n 'region.<key>'.
  function regionKey(lon, lat) {
    return isLand(lon, lat) ? continentKey(lon, lat) : seaKey(lon, lat);
  }

  EBE.geo = { haversineKm, bearing, dir8, placeName, coords, isLand, regionKey, continentKey, seaKey };

  // ---------- map view ----------
  function MapView(root, opts) {
    this.opts = opts || {};
    this.root = root;
    this.points = null;
    this.flashes = [];
    this.cursor = { lon: -63.5, lat: -27.8, show: false, radiusKm: 0 };
    this.interactive = false;

    const frame = document.createElement('div');
    frame.className = 'map';
    this.img = document.createElement('img');
    this.img.className = 'map-img';
    this.img.alt = '';
    this.img.decoding = 'async';
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'map-overlay';
    this.canvas.setAttribute('aria-hidden', 'true');
    frame.appendChild(this.img); frame.appendChild(this.canvas);
    root.appendChild(frame);
    this.frame = frame;
    this.ctx = this.canvas.getContext('2d');
    this.layer = document.createElement('canvas');

    const onPointer = e => {
      if (!this.interactive) return;
      const r = this.frame.getBoundingClientRect();
      const x = clamp(e.clientX - r.left, 0, r.width), y = clamp(e.clientY - r.top, 0, r.height);
      const lon = x / r.width * 360 - 180, lat = 90 - y / r.height * 180;
      if (this.opts.onPointer) this.opts.onPointer(lon, lat, e.type);
    };
    frame.addEventListener('pointerdown', e => { if (this.interactive) { frame.setPointerCapture(e.pointerId); onPointer(e); } });
    frame.addEventListener('pointermove', e => { if (this.interactive && (e.buttons || e.pointerType === 'mouse')) onPointer(e); });
    // Lifting the finger (or releasing the mouse) after exploring.
    const onEnd = () => { if (this.interactive && this.opts.onPointerEnd) this.opts.onPointerEnd(); };
    frame.addEventListener('pointerup', onEnd);
    frame.addEventListener('pointercancel', onEnd);

    if ('ResizeObserver' in window) new ResizeObserver(() => this.resize()).observe(frame);
    window.addEventListener('resize', () => this.resize());
    this.resize();
    const loop = () => { if (this.frame.offsetParent !== null) this.draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  MapView.prototype.resize = function () {
    const r = this.frame.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height); this.dpr = dpr;
    [this.canvas, this.layer].forEach(c => { c.width = Math.round(this.w * dpr); c.height = Math.round(this.h * dpr); });
    this.renderLayer();
  };

  MapView.prototype.toXY = function (lon, lat) { return [(lon + 180) / 360 * this.w, (90 - lat) / 180 * this.h]; };

  MapView.prototype.setImage = function (src, alt) {
    if (src) { this.frame.classList.remove('no-image'); if (this.img.getAttribute('src') !== src) this.img.src = src; }
    else { this.frame.classList.add('no-image'); this.img.removeAttribute('src'); }
    this.img.alt = alt || '';
  };

  MapView.prototype.setInteractive = function (on) {
    this.interactive = !!on;
    this.frame.classList.toggle('interactive', !!on);
  };

  MapView.prototype.setPoints = function (points) { this.points = points; this.renderLayer(); };

  MapView.prototype.flash = function (lon, lat, intensity) {
    if (EBE.a11y.reducedMotion()) return;
    this.flashes.push({ lon, lat, i: intensity, t: performance.now() });
    if (this.flashes.length > 120) this.flashes.shift();
  };

  MapView.prototype.setCursor = function (lon, lat, show, radiusKm) {
    this.cursor = { lon, lat, show: !!show, radiusKm: radiusKm || 0 };
  };

  // Static layer: graticule when there is no image, then the point glows.
  MapView.prototype.renderLayer = function () {
    const c = this.layer.getContext('2d'), dpr = this.dpr || 1;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    if (this.frame.classList.contains('no-image')) {
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 1;
      for (let lon = -180; lon <= 180; lon += 30) { const [x] = this.toXY(lon, 0); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, this.h); c.stroke(); }
      for (let lat = -90; lat <= 90; lat += 30) { const [, y] = this.toXY(0, lat); c.beginPath(); c.moveTo(0, y); c.lineTo(this.w, y); c.stroke(); }
    }
    if (!this.points) return;
    // Glow size follows the map width, so small phone screens do not turn fires into one blob.
    const scale = Math.max(0.4, Math.min(1.2, this.w / 1024));
    c.globalCompositeOperation = 'lighter';
    for (const p of this.points) {
      const [x, y] = this.toXY(p[0], p[1]);
      const r = (1.1 + 2.8 * p[2]) * scale;
      const g = c.createRadialGradient(x, y, 0, x, y, r * 2.2);
      g.addColorStop(0, p[2] > 0.66 ? 'rgba(255,255,255,0.95)' : 'rgba(235,235,235,0.85)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.2, 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  };

  MapView.prototype.draw = function () {
    const c = this.ctx, dpr = this.dpr || 1;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.drawImage(this.layer, 0, 0);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    const now = performance.now();
    this.flashes = this.flashes.filter(f => now - f.t < 700);
    for (const f of this.flashes) {
      const age = (now - f.t) / 700, [x, y] = this.toXY(f.lon, f.lat);
      c.strokeStyle = 'rgba(255,255,255,' + (0.8 * (1 - age)).toFixed(3) + ')';
      c.lineWidth = 1.5;
      c.beginPath(); c.arc(x, y, 3 + 14 * age * (0.5 + f.i), 0, Math.PI * 2); c.stroke();
    }
    if (this.cursor.show) {
      const [x, y] = this.toXY(this.cursor.lon, this.cursor.lat);
      if (this.cursor.radiusKm) {
        const ry = this.cursor.radiusKm / 111 / 180 * this.h;
        const rx = ry / Math.max(0.2, Math.cos(this.cursor.lat * RAD));
        c.strokeStyle = 'rgba(255,255,255,0.55)'; c.setLineDash([4, 4]); c.lineWidth = 1;
        c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      }
      c.strokeStyle = '#ffffff'; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, 9, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x - 15, y); c.lineTo(x - 5, y); c.moveTo(x + 5, y); c.lineTo(x + 15, y);
      c.moveTo(x, y - 15); c.lineTo(x, y - 5); c.moveTo(x, y + 5); c.lineTo(x, y + 15); c.stroke();
    }
  };

  EBE.MapView = MapView;
})();
