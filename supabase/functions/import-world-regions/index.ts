import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Comprehensive list of countries with ISO codes
const COUNTRIES_DATA = [
  { name: "Afghanistan", code_iso2: "AF", code_iso3: "AFG" },
  { name: "Albanie", code_iso2: "AL", code_iso3: "ALB" },
  { name: "Algérie", code_iso2: "DZ", code_iso3: "DZA" },
  { name: "Allemagne", code_iso2: "DE", code_iso3: "DEU" },
  { name: "Andorre", code_iso2: "AD", code_iso3: "AND" },
  { name: "Angola", code_iso2: "AO", code_iso3: "AGO" },
  { name: "Argentine", code_iso2: "AR", code_iso3: "ARG" },
  { name: "Arménie", code_iso2: "AM", code_iso3: "ARM" },
  { name: "Australie", code_iso2: "AU", code_iso3: "AUS" },
  { name: "Autriche", code_iso2: "AT", code_iso3: "AUT" },
  { name: "Azerbaïdjan", code_iso2: "AZ", code_iso3: "AZE" },
  { name: "Bahreïn", code_iso2: "BH", code_iso3: "BHR" },
  { name: "Bangladesh", code_iso2: "BD", code_iso3: "BGD" },
  { name: "Belgique", code_iso2: "BE", code_iso3: "BEL" },
  { name: "Bénin", code_iso2: "BJ", code_iso3: "BEN" },
  { name: "Bhoutan", code_iso2: "BT", code_iso3: "BTN" },
  { name: "Biélorussie", code_iso2: "BY", code_iso3: "BLR" },
  { name: "Birmanie", code_iso2: "MM", code_iso3: "MMR" },
  { name: "Bolivie", code_iso2: "BO", code_iso3: "BOL" },
  { name: "Bosnie-Herzégovine", code_iso2: "BA", code_iso3: "BIH" },
  { name: "Botswana", code_iso2: "BW", code_iso3: "BWA" },
  { name: "Brésil", code_iso2: "BR", code_iso3: "BRA" },
  { name: "Brunei", code_iso2: "BN", code_iso3: "BRN" },
  { name: "Bulgarie", code_iso2: "BG", code_iso3: "BGR" },
  { name: "Burkina Faso", code_iso2: "BF", code_iso3: "BFA" },
  { name: "Burundi", code_iso2: "BI", code_iso3: "BDI" },
  { name: "Cambodge", code_iso2: "KH", code_iso3: "KHM" },
  { name: "Cameroun", code_iso2: "CM", code_iso3: "CMR" },
  { name: "Canada", code_iso2: "CA", code_iso3: "CAN" },
  { name: "Cap-Vert", code_iso2: "CV", code_iso3: "CPV" },
  { name: "Centrafrique", code_iso2: "CF", code_iso3: "CAF" },
  { name: "Chili", code_iso2: "CL", code_iso3: "CHL" },
  { name: "Chine", code_iso2: "CN", code_iso3: "CHN" },
  { name: "Chypre", code_iso2: "CY", code_iso3: "CYP" },
  { name: "Colombie", code_iso2: "CO", code_iso3: "COL" },
  { name: "Comores", code_iso2: "KM", code_iso3: "COM" },
  { name: "Corée du Nord", code_iso2: "KP", code_iso3: "PRK" },
  { name: "Corée du Sud", code_iso2: "KR", code_iso3: "KOR" },
  { name: "Costa Rica", code_iso2: "CR", code_iso3: "CRI" },
  { name: "Côte d'Ivoire", code_iso2: "CI", code_iso3: "CIV" },
  { name: "Croatie", code_iso2: "HR", code_iso3: "HRV" },
  { name: "Cuba", code_iso2: "CU", code_iso3: "CUB" },
  { name: "Danemark", code_iso2: "DK", code_iso3: "DNK" },
  { name: "Djibouti", code_iso2: "DJ", code_iso3: "DJI" },
  { name: "Égypte", code_iso2: "EG", code_iso3: "EGY" },
  { name: "Émirats arabes unis", code_iso2: "AE", code_iso3: "ARE" },
  { name: "Équateur", code_iso2: "EC", code_iso3: "ECU" },
  { name: "Érythrée", code_iso2: "ER", code_iso3: "ERI" },
  { name: "Espagne", code_iso2: "ES", code_iso3: "ESP" },
  { name: "Estonie", code_iso2: "EE", code_iso3: "EST" },
  { name: "Eswatini", code_iso2: "SZ", code_iso3: "SWZ" },
  { name: "États-Unis", code_iso2: "US", code_iso3: "USA" },
  { name: "Éthiopie", code_iso2: "ET", code_iso3: "ETH" },
  { name: "Fidji", code_iso2: "FJ", code_iso3: "FJI" },
  { name: "Finlande", code_iso2: "FI", code_iso3: "FIN" },
  { name: "France", code_iso2: "FR", code_iso3: "FRA" },
  { name: "Gabon", code_iso2: "GA", code_iso3: "GAB" },
  { name: "Gambie", code_iso2: "GM", code_iso3: "GMB" },
  { name: "Géorgie", code_iso2: "GE", code_iso3: "GEO" },
  { name: "Ghana", code_iso2: "GH", code_iso3: "GHA" },
  { name: "Grèce", code_iso2: "GR", code_iso3: "GRC" },
  { name: "Guatemala", code_iso2: "GT", code_iso3: "GTM" },
  { name: "Guinée", code_iso2: "GN", code_iso3: "GIN" },
  { name: "Guinée équatoriale", code_iso2: "GQ", code_iso3: "GNQ" },
  { name: "Guinée-Bissau", code_iso2: "GW", code_iso3: "GNB" },
  { name: "Guyana", code_iso2: "GY", code_iso3: "GUY" },
  { name: "Haïti", code_iso2: "HT", code_iso3: "HTI" },
  { name: "Honduras", code_iso2: "HN", code_iso3: "HND" },
  { name: "Hongrie", code_iso2: "HU", code_iso3: "HUN" },
  { name: "Inde", code_iso2: "IN", code_iso3: "IND" },
  { name: "Indonésie", code_iso2: "ID", code_iso3: "IDN" },
  { name: "Irak", code_iso2: "IQ", code_iso3: "IRQ" },
  { name: "Iran", code_iso2: "IR", code_iso3: "IRN" },
  { name: "Irlande", code_iso2: "IE", code_iso3: "IRL" },
  { name: "Islande", code_iso2: "IS", code_iso3: "ISL" },
  { name: "Israël", code_iso2: "IL", code_iso3: "ISR" },
  { name: "Italie", code_iso2: "IT", code_iso3: "ITA" },
  { name: "Jamaïque", code_iso2: "JM", code_iso3: "JAM" },
  { name: "Japon", code_iso2: "JP", code_iso3: "JPN" },
  { name: "Jordanie", code_iso2: "JO", code_iso3: "JOR" },
  { name: "Kazakhstan", code_iso2: "KZ", code_iso3: "KAZ" },
  { name: "Kenya", code_iso2: "KE", code_iso3: "KEN" },
  { name: "Kirghizistan", code_iso2: "KG", code_iso3: "KGZ" },
  { name: "Koweït", code_iso2: "KW", code_iso3: "KWT" },
  { name: "Laos", code_iso2: "LA", code_iso3: "LAO" },
  { name: "Lesotho", code_iso2: "LS", code_iso3: "LSO" },
  { name: "Lettonie", code_iso2: "LV", code_iso3: "LVA" },
  { name: "Liban", code_iso2: "LB", code_iso3: "LBN" },
  { name: "Liberia", code_iso2: "LR", code_iso3: "LBR" },
  { name: "Libye", code_iso2: "LY", code_iso3: "LBY" },
  { name: "Liechtenstein", code_iso2: "LI", code_iso3: "LIE" },
  { name: "Lituanie", code_iso2: "LT", code_iso3: "LTU" },
  { name: "Luxembourg", code_iso2: "LU", code_iso3: "LUX" },
  { name: "Macédoine du Nord", code_iso2: "MK", code_iso3: "MKD" },
  { name: "Madagascar", code_iso2: "MG", code_iso3: "MDG" },
  { name: "Malaisie", code_iso2: "MY", code_iso3: "MYS" },
  { name: "Malawi", code_iso2: "MW", code_iso3: "MWI" },
  { name: "Maldives", code_iso2: "MV", code_iso3: "MDV" },
  { name: "Mali", code_iso2: "ML", code_iso3: "MLI" },
  { name: "Malte", code_iso2: "MT", code_iso3: "MLT" },
  { name: "Maroc", code_iso2: "MA", code_iso3: "MAR" },
  { name: "Maurice", code_iso2: "MU", code_iso3: "MUS" },
  { name: "Mauritanie", code_iso2: "MR", code_iso3: "MRT" },
  { name: "Mexique", code_iso2: "MX", code_iso3: "MEX" },
  { name: "Moldavie", code_iso2: "MD", code_iso3: "MDA" },
  { name: "Monaco", code_iso2: "MC", code_iso3: "MCO" },
  { name: "Mongolie", code_iso2: "MN", code_iso3: "MNG" },
  { name: "Monténégro", code_iso2: "ME", code_iso3: "MNE" },
  { name: "Mozambique", code_iso2: "MZ", code_iso3: "MOZ" },
  { name: "Namibie", code_iso2: "NA", code_iso3: "NAM" },
  { name: "Népal", code_iso2: "NP", code_iso3: "NPL" },
  { name: "Nicaragua", code_iso2: "NI", code_iso3: "NIC" },
  { name: "Niger", code_iso2: "NE", code_iso3: "NER" },
  { name: "Nigeria", code_iso2: "NG", code_iso3: "NGA" },
  { name: "Norvège", code_iso2: "NO", code_iso3: "NOR" },
  { name: "Nouvelle-Zélande", code_iso2: "NZ", code_iso3: "NZL" },
  { name: "Oman", code_iso2: "OM", code_iso3: "OMN" },
  { name: "Ouganda", code_iso2: "UG", code_iso3: "UGA" },
  { name: "Ouzbékistan", code_iso2: "UZ", code_iso3: "UZB" },
  { name: "Pakistan", code_iso2: "PK", code_iso3: "PAK" },
  { name: "Palestine", code_iso2: "PS", code_iso3: "PSE" },
  { name: "Panama", code_iso2: "PA", code_iso3: "PAN" },
  { name: "Papouasie-Nouvelle-Guinée", code_iso2: "PG", code_iso3: "PNG" },
  { name: "Paraguay", code_iso2: "PY", code_iso3: "PRY" },
  { name: "Pays-Bas", code_iso2: "NL", code_iso3: "NLD" },
  { name: "Pérou", code_iso2: "PE", code_iso3: "PER" },
  { name: "Philippines", code_iso2: "PH", code_iso3: "PHL" },
  { name: "Pologne", code_iso2: "PL", code_iso3: "POL" },
  { name: "Portugal", code_iso2: "PT", code_iso3: "PRT" },
  { name: "Qatar", code_iso2: "QA", code_iso3: "QAT" },
  { name: "République démocratique du Congo", code_iso2: "CD", code_iso3: "COD" },
  { name: "République dominicaine", code_iso2: "DO", code_iso3: "DOM" },
  { name: "République du Congo", code_iso2: "CG", code_iso3: "COG" },
  { name: "République tchèque", code_iso2: "CZ", code_iso3: "CZE" },
  { name: "Roumanie", code_iso2: "RO", code_iso3: "ROU" },
  { name: "Royaume-Uni", code_iso2: "GB", code_iso3: "GBR" },
  { name: "Russie", code_iso2: "RU", code_iso3: "RUS" },
  { name: "Rwanda", code_iso2: "RW", code_iso3: "RWA" },
  { name: "Salvador", code_iso2: "SV", code_iso3: "SLV" },
  { name: "Sao Tomé-et-Príncipe", code_iso2: "ST", code_iso3: "STP" },
  { name: "Arabie saoudite", code_iso2: "SA", code_iso3: "SAU" },
  { name: "Sénégal", code_iso2: "SN", code_iso3: "SEN" },
  { name: "Serbie", code_iso2: "RS", code_iso3: "SRB" },
  { name: "Seychelles", code_iso2: "SC", code_iso3: "SYC" },
  { name: "Sierra Leone", code_iso2: "SL", code_iso3: "SLE" },
  { name: "Singapour", code_iso2: "SG", code_iso3: "SGP" },
  { name: "Slovaquie", code_iso2: "SK", code_iso3: "SVK" },
  { name: "Slovénie", code_iso2: "SI", code_iso3: "SVN" },
  { name: "Somalie", code_iso2: "SO", code_iso3: "SOM" },
  { name: "Soudan", code_iso2: "SD", code_iso3: "SDN" },
  { name: "Soudan du Sud", code_iso2: "SS", code_iso3: "SSD" },
  { name: "Sri Lanka", code_iso2: "LK", code_iso3: "LKA" },
  { name: "Suède", code_iso2: "SE", code_iso3: "SWE" },
  { name: "Suisse", code_iso2: "CH", code_iso3: "CHE" },
  { name: "Suriname", code_iso2: "SR", code_iso3: "SUR" },
  { name: "Syrie", code_iso2: "SY", code_iso3: "SYR" },
  { name: "Tadjikistan", code_iso2: "TJ", code_iso3: "TJK" },
  { name: "Tanzanie", code_iso2: "TZ", code_iso3: "TZA" },
  { name: "Tchad", code_iso2: "TD", code_iso3: "TCD" },
  { name: "Thaïlande", code_iso2: "TH", code_iso3: "THA" },
  { name: "Timor oriental", code_iso2: "TL", code_iso3: "TLS" },
  { name: "Togo", code_iso2: "TG", code_iso3: "TGO" },
  { name: "Trinité-et-Tobago", code_iso2: "TT", code_iso3: "TTO" },
  { name: "Tunisie", code_iso2: "TN", code_iso3: "TUN" },
  { name: "Turkménistan", code_iso2: "TM", code_iso3: "TKM" },
  { name: "Turquie", code_iso2: "TR", code_iso3: "TUR" },
  { name: "Ukraine", code_iso2: "UA", code_iso3: "UKR" },
  { name: "Uruguay", code_iso2: "UY", code_iso3: "URY" },
  { name: "Venezuela", code_iso2: "VE", code_iso3: "VEN" },
  { name: "Viêt Nam", code_iso2: "VN", code_iso3: "VNM" },
  { name: "Yémen", code_iso2: "YE", code_iso3: "YEM" },
  { name: "Zambie", code_iso2: "ZM", code_iso3: "ZMB" },
  { name: "Zimbabwe", code_iso2: "ZW", code_iso3: "ZWE" },
];

// Comprehensive list of regions by country (ISO2 code) with coordinates
const REGIONS_DATA: Record<string, Array<{ name: string; code?: string; latitude: number; longitude: number }>> = {
  // France - Régions
  "FR": [
    { name: "Île-de-France", code: "IDF", latitude: 48.8566, longitude: 2.3522 },
    { name: "Auvergne-Rhône-Alpes", code: "ARA", latitude: 45.7640, longitude: 4.8357 },
    { name: "Bourgogne-Franche-Comté", code: "BFC", latitude: 47.2805, longitude: 4.9994 },
    { name: "Bretagne", code: "BRE", latitude: 48.2020, longitude: -2.9326 },
    { name: "Centre-Val de Loire", code: "CVL", latitude: 47.7516, longitude: 1.6751 },
    { name: "Corse", code: "COR", latitude: 42.0396, longitude: 9.0129 },
    { name: "Grand Est", code: "GES", latitude: 48.6998, longitude: 6.1878 },
    { name: "Hauts-de-France", code: "HDF", latitude: 49.9628, longitude: 2.7622 },
    { name: "Normandie", code: "NOR", latitude: 49.1829, longitude: -0.3707 },
    { name: "Nouvelle-Aquitaine", code: "NAQ", latitude: 44.8378, longitude: -0.5792 },
    { name: "Occitanie", code: "OCC", latitude: 43.6047, longitude: 1.4442 },
    { name: "Pays de la Loire", code: "PDL", latitude: 47.4784, longitude: -0.5632 },
    { name: "Provence-Alpes-Côte d'Azur", code: "PAC", latitude: 43.9352, longitude: 6.0679 },
    { name: "Guadeloupe", code: "GUA", latitude: 16.2650, longitude: -61.5510 },
    { name: "Martinique", code: "MTQ", latitude: 14.6415, longitude: -61.0242 },
    { name: "Guyane", code: "GUF", latitude: 3.9339, longitude: -53.1258 },
    { name: "La Réunion", code: "REU", latitude: -21.1151, longitude: 55.5364 },
    { name: "Mayotte", code: "MAY", latitude: -12.8275, longitude: 45.1662 },
  ],
  // Sénégal - Régions
  "SN": [
    { name: "Dakar", code: "DK", latitude: 14.6937, longitude: -17.4441 },
    { name: "Diourbel", code: "DB", latitude: 14.6546, longitude: -16.2314 },
    { name: "Fatick", code: "FK", latitude: 14.3390, longitude: -16.4110 },
    { name: "Kaffrine", code: "KA", latitude: 14.1059, longitude: -15.5508 },
    { name: "Kaolack", code: "KL", latitude: 14.1652, longitude: -16.0726 },
    { name: "Kédougou", code: "KE", latitude: 12.5605, longitude: -12.1747 },
    { name: "Kolda", code: "KD", latitude: 12.8983, longitude: -14.9503 },
    { name: "Louga", code: "LG", latitude: 15.6144, longitude: -16.2280 },
    { name: "Matam", code: "MT", latitude: 15.6559, longitude: -13.2554 },
    { name: "Saint-Louis", code: "SL", latitude: 16.0179, longitude: -16.4897 },
    { name: "Sédhiou", code: "SE", latitude: 12.7081, longitude: -15.5569 },
    { name: "Tambacounda", code: "TC", latitude: 13.7707, longitude: -13.6673 },
    { name: "Thiès", code: "TH", latitude: 14.7910, longitude: -16.9359 },
    { name: "Ziguinchor", code: "ZG", latitude: 12.5681, longitude: -16.2719 },
  ],
  // Côte d'Ivoire - Districts et Régions
  "CI": [
    { name: "Abidjan", code: "AB", latitude: 5.3600, longitude: -4.0083 },
    { name: "Yamoussoukro", code: "YM", latitude: 6.8276, longitude: -5.2893 },
    { name: "Bas-Sassandra", code: "BS", latitude: 4.9500, longitude: -6.0833 },
    { name: "Comoé", code: "CM", latitude: 5.3000, longitude: -3.2500 },
    { name: "Denguélé", code: "DN", latitude: 9.5000, longitude: -7.5000 },
    { name: "Gôh-Djiboua", code: "GD", latitude: 5.9333, longitude: -5.9333 },
    { name: "Lacs", code: "LC", latitude: 6.5833, longitude: -4.8333 },
    { name: "Lagunes", code: "LG", latitude: 5.5833, longitude: -4.0000 },
    { name: "Montagnes", code: "MG", latitude: 7.0000, longitude: -7.5000 },
    { name: "Sassandra-Marahoué", code: "SM", latitude: 6.8500, longitude: -6.4500 },
    { name: "Savanes", code: "SV", latitude: 9.5000, longitude: -5.5000 },
    { name: "Vallée du Bandama", code: "VB", latitude: 7.6833, longitude: -5.0333 },
    { name: "Woroba", code: "WR", latitude: 8.2500, longitude: -6.9000 },
    { name: "Zanzan", code: "ZZ", latitude: 8.0000, longitude: -3.0000 },
  ],
  // Mali - Régions
  "ML": [
    { name: "Bamako", code: "BKO", latitude: 12.6392, longitude: -8.0029 },
    { name: "Gao", code: "GAO", latitude: 16.2666, longitude: -0.0499 },
    { name: "Kayes", code: "KYS", latitude: 14.4490, longitude: -11.4346 },
    { name: "Kidal", code: "KDL", latitude: 18.4411, longitude: 1.4078 },
    { name: "Koulikoro", code: "KLK", latitude: 12.8628, longitude: -7.5589 },
    { name: "Mopti", code: "MOP", latitude: 14.4843, longitude: -4.1976 },
    { name: "Ségou", code: "SEG", latitude: 13.4317, longitude: -6.2157 },
    { name: "Sikasso", code: "SKS", latitude: 11.3176, longitude: -5.6664 },
    { name: "Tombouctou", code: "TOM", latitude: 16.7666, longitude: -3.0026 },
    { name: "Ménaka", code: "MNK", latitude: 15.9167, longitude: 2.4000 },
    { name: "Taoudénit", code: "TAO", latitude: 22.6789, longitude: -3.9806 },
  ],
  // Burkina Faso - Régions
  "BF": [
    { name: "Boucle du Mouhoun", code: "01", latitude: 12.4167, longitude: -3.4167 },
    { name: "Cascades", code: "02", latitude: 10.6333, longitude: -4.8333 },
    { name: "Centre", code: "03", latitude: 12.3714, longitude: -1.5197 },
    { name: "Centre-Est", code: "04", latitude: 11.5250, longitude: -0.1500 },
    { name: "Centre-Nord", code: "05", latitude: 13.2000, longitude: -1.0833 },
    { name: "Centre-Ouest", code: "06", latitude: 12.2500, longitude: -2.3667 },
    { name: "Centre-Sud", code: "07", latitude: 11.5167, longitude: -1.1000 },
    { name: "Est", code: "08", latitude: 12.0833, longitude: 0.8500 },
    { name: "Hauts-Bassins", code: "09", latitude: 11.1667, longitude: -4.2833 },
    { name: "Nord", code: "10", latitude: 13.5833, longitude: -2.4167 },
    { name: "Plateau-Central", code: "11", latitude: 12.5000, longitude: -0.7500 },
    { name: "Sahel", code: "12", latitude: 14.2000, longitude: -0.1500 },
    { name: "Sud-Ouest", code: "13", latitude: 10.0833, longitude: -3.2667 },
  ],
  // Niger - Régions
  "NE": [
    { name: "Agadez", code: "1", latitude: 16.9667, longitude: 7.9833 },
    { name: "Diffa", code: "2", latitude: 13.3167, longitude: 12.6167 },
    { name: "Dosso", code: "3", latitude: 13.0500, longitude: 3.2000 },
    { name: "Maradi", code: "4", latitude: 13.5000, longitude: 7.1000 },
    { name: "Niamey", code: "8", latitude: 13.5137, longitude: 2.1098 },
    { name: "Tahoua", code: "5", latitude: 14.8833, longitude: 5.2667 },
    { name: "Tillabéri", code: "6", latitude: 14.2117, longitude: 1.4522 },
    { name: "Zinder", code: "7", latitude: 13.8000, longitude: 8.9833 },
  ],
  // Cameroun - Régions
  "CM": [
    { name: "Adamaoua", code: "AD", latitude: 7.3333, longitude: 13.5833 },
    { name: "Centre", code: "CE", latitude: 3.8667, longitude: 11.5167 },
    { name: "Est", code: "ES", latitude: 4.1667, longitude: 13.1833 },
    { name: "Extrême-Nord", code: "EN", latitude: 10.5833, longitude: 14.0833 },
    { name: "Littoral", code: "LT", latitude: 4.0500, longitude: 9.7000 },
    { name: "Nord", code: "NO", latitude: 9.3000, longitude: 13.3833 },
    { name: "Nord-Ouest", code: "NW", latitude: 5.9500, longitude: 10.1500 },
    { name: "Ouest", code: "OU", latitude: 5.4833, longitude: 10.4167 },
    { name: "Sud", code: "SU", latitude: 2.8333, longitude: 10.9167 },
    { name: "Sud-Ouest", code: "SW", latitude: 5.0000, longitude: 9.3500 },
  ],
  // Bénin - Départements
  "BJ": [
    { name: "Alibori", code: "AL", latitude: 11.1333, longitude: 2.7500 },
    { name: "Atacora", code: "AK", latitude: 10.3000, longitude: 1.3833 },
    { name: "Atlantique", code: "AQ", latitude: 6.5333, longitude: 2.1000 },
    { name: "Borgou", code: "BO", latitude: 9.6000, longitude: 2.7500 },
    { name: "Collines", code: "CO", latitude: 8.0000, longitude: 2.3167 },
    { name: "Couffo", code: "KO", latitude: 6.9000, longitude: 1.6833 },
    { name: "Donga", code: "DO", latitude: 9.7000, longitude: 1.6500 },
    { name: "Littoral", code: "LI", latitude: 6.3703, longitude: 2.3912 },
    { name: "Mono", code: "MO", latitude: 6.6000, longitude: 1.7667 },
    { name: "Ouémé", code: "OU", latitude: 6.6000, longitude: 2.4833 },
    { name: "Plateau", code: "PL", latitude: 7.3500, longitude: 2.6000 },
    { name: "Zou", code: "ZO", latitude: 7.1667, longitude: 2.1333 },
  ],
  // Togo - Régions
  "TG": [
    { name: "Centrale", code: "C", latitude: 8.7500, longitude: 1.0667 },
    { name: "Kara", code: "K", latitude: 9.5500, longitude: 1.1833 },
    { name: "Maritime", code: "M", latitude: 6.1333, longitude: 1.2167 },
    { name: "Plateaux", code: "P", latitude: 7.5000, longitude: 1.0000 },
    { name: "Savanes", code: "S", latitude: 10.5833, longitude: 0.4667 },
  ],
  // Guinée - Régions
  "GN": [
    { name: "Boké", code: "B", latitude: 10.9333, longitude: -14.2833 },
    { name: "Conakry", code: "C", latitude: 9.6412, longitude: -13.5784 },
    { name: "Faranah", code: "F", latitude: 10.0333, longitude: -10.7500 },
    { name: "Kankan", code: "K", latitude: 10.3833, longitude: -9.3000 },
    { name: "Kindia", code: "D", latitude: 10.0500, longitude: -12.8667 },
    { name: "Labé", code: "L", latitude: 11.3167, longitude: -12.2833 },
    { name: "Mamou", code: "M", latitude: 10.3833, longitude: -12.0833 },
    { name: "N'Zérékoré", code: "N", latitude: 7.7500, longitude: -8.8167 },
  ],
  // Maroc - Régions
  "MA": [
    { name: "Tanger-Tétouan-Al Hoceïma", code: "01", latitude: 35.7595, longitude: -5.8340 },
    { name: "Oriental", code: "02", latitude: 34.6867, longitude: -1.9114 },
    { name: "Fès-Meknès", code: "03", latitude: 33.8935, longitude: -4.9512 },
    { name: "Rabat-Salé-Kénitra", code: "04", latitude: 34.0209, longitude: -6.8416 },
    { name: "Béni Mellal-Khénifra", code: "05", latitude: 32.3373, longitude: -6.3498 },
    { name: "Casablanca-Settat", code: "06", latitude: 33.5731, longitude: -7.5898 },
    { name: "Marrakech-Safi", code: "07", latitude: 31.6295, longitude: -7.9811 },
    { name: "Drâa-Tafilalet", code: "08", latitude: 31.1499, longitude: -5.8644 },
    { name: "Souss-Massa", code: "09", latitude: 30.4278, longitude: -9.5981 },
    { name: "Guelmim-Oued Noun", code: "10", latitude: 28.9869, longitude: -10.0574 },
    { name: "Laâyoune-Sakia El Hamra", code: "11", latitude: 27.1536, longitude: -13.2034 },
    { name: "Dakhla-Oued Ed-Dahab", code: "12", latitude: 23.7147, longitude: -15.9369 },
  ],
  // Tunisie - Gouvernorats
  "TN": [
    { name: "Tunis", code: "11", latitude: 36.8065, longitude: 10.1815 },
    { name: "Ariana", code: "12", latitude: 36.8625, longitude: 10.1956 },
    { name: "Ben Arous", code: "13", latitude: 36.7531, longitude: 10.2189 },
    { name: "Manouba", code: "14", latitude: 36.8101, longitude: 9.8709 },
    { name: "Nabeul", code: "21", latitude: 36.4561, longitude: 10.7376 },
    { name: "Zaghouan", code: "22", latitude: 36.4029, longitude: 10.1423 },
    { name: "Bizerte", code: "23", latitude: 37.2744, longitude: 9.8739 },
    { name: "Béja", code: "31", latitude: 36.7256, longitude: 9.1817 },
    { name: "Jendouba", code: "32", latitude: 36.5011, longitude: 8.7757 },
    { name: "Le Kef", code: "33", latitude: 36.1674, longitude: 8.7049 },
    { name: "Siliana", code: "34", latitude: 36.0849, longitude: 9.3704 },
    { name: "Sousse", code: "51", latitude: 35.8288, longitude: 10.6405 },
    { name: "Monastir", code: "52", latitude: 35.7773, longitude: 10.8262 },
    { name: "Mahdia", code: "53", latitude: 35.5047, longitude: 11.0622 },
    { name: "Sfax", code: "61", latitude: 34.7406, longitude: 10.7603 },
    { name: "Kairouan", code: "41", latitude: 35.6781, longitude: 10.0963 },
    { name: "Kasserine", code: "42", latitude: 35.1676, longitude: 8.8365 },
    { name: "Sidi Bouzid", code: "43", latitude: 35.0354, longitude: 9.4840 },
    { name: "Gabès", code: "71", latitude: 33.8815, longitude: 10.0982 },
    { name: "Médenine", code: "72", latitude: 33.3549, longitude: 10.5055 },
    { name: "Tataouine", code: "73", latitude: 32.9297, longitude: 10.4518 },
    { name: "Gafsa", code: "81", latitude: 34.4250, longitude: 8.7842 },
    { name: "Tozeur", code: "82", latitude: 33.9197, longitude: 8.1339 },
    { name: "Kébili", code: "83", latitude: 33.7048, longitude: 8.9696 },
  ],
  // Algérie - Wilayas
  "DZ": [
    { name: "Alger", code: "16", latitude: 36.7538, longitude: 3.0588 },
    { name: "Oran", code: "31", latitude: 35.6969, longitude: -0.6331 },
    { name: "Constantine", code: "25", latitude: 36.3650, longitude: 6.6147 },
    { name: "Annaba", code: "23", latitude: 36.9000, longitude: 7.7667 },
    { name: "Blida", code: "09", latitude: 36.4700, longitude: 2.8300 },
    { name: "Sétif", code: "19", latitude: 36.1898, longitude: 5.4108 },
    { name: "Djelfa", code: "17", latitude: 34.6667, longitude: 3.2500 },
    { name: "Biskra", code: "07", latitude: 34.8500, longitude: 5.7333 },
    { name: "Batna", code: "05", latitude: 35.5667, longitude: 6.1667 },
    { name: "Tlemcen", code: "13", latitude: 34.8828, longitude: -1.3167 },
    { name: "Béjaïa", code: "06", latitude: 36.7539, longitude: 5.0844 },
    { name: "Tizi Ouzou", code: "15", latitude: 36.7117, longitude: 4.0456 },
    { name: "Chlef", code: "02", latitude: 36.1653, longitude: 1.3317 },
    { name: "Tiaret", code: "14", latitude: 35.3711, longitude: 1.3172 },
    { name: "Ouargla", code: "30", latitude: 31.9500, longitude: 5.3250 },
    { name: "Tamanrasset", code: "11", latitude: 22.7850, longitude: 5.5228 },
  ],
  // Allemagne - Länder
  "DE": [
    { name: "Bade-Wurtemberg", code: "BW", latitude: 48.6616, longitude: 9.3501 },
    { name: "Bavière", code: "BY", latitude: 48.7904, longitude: 11.4979 },
    { name: "Berlin", code: "BE", latitude: 52.5200, longitude: 13.4050 },
    { name: "Brandebourg", code: "BB", latitude: 52.1308, longitude: 13.8089 },
    { name: "Brême", code: "HB", latitude: 53.0793, longitude: 8.8017 },
    { name: "Hambourg", code: "HH", latitude: 53.5511, longitude: 9.9937 },
    { name: "Hesse", code: "HE", latitude: 50.6521, longitude: 9.1624 },
    { name: "Basse-Saxe", code: "NI", latitude: 52.6367, longitude: 9.8451 },
    { name: "Mecklembourg-Poméranie-Occidentale", code: "MV", latitude: 53.6127, longitude: 12.4296 },
    { name: "Rhénanie-du-Nord-Westphalie", code: "NW", latitude: 51.4332, longitude: 7.6616 },
    { name: "Rhénanie-Palatinat", code: "RP", latitude: 50.1183, longitude: 7.3090 },
    { name: "Sarre", code: "SL", latitude: 49.3964, longitude: 7.0230 },
    { name: "Saxe", code: "SN", latitude: 51.1045, longitude: 13.2017 },
    { name: "Saxe-Anhalt", code: "ST", latitude: 51.9503, longitude: 11.6923 },
    { name: "Schleswig-Holstein", code: "SH", latitude: 54.2194, longitude: 9.6961 },
    { name: "Thuringe", code: "TH", latitude: 50.9014, longitude: 11.0348 },
  ],
  // États-Unis - États
  "US": [
    { name: "Alabama", code: "AL", latitude: 32.3182, longitude: -86.9023 },
    { name: "Alaska", code: "AK", latitude: 64.2008, longitude: -152.4937 },
    { name: "Arizona", code: "AZ", latitude: 34.0489, longitude: -111.0937 },
    { name: "Arkansas", code: "AR", latitude: 35.2010, longitude: -91.8318 },
    { name: "Californie", code: "CA", latitude: 36.7783, longitude: -119.4179 },
    { name: "Colorado", code: "CO", latitude: 39.5501, longitude: -105.7821 },
    { name: "Connecticut", code: "CT", latitude: 41.6032, longitude: -73.0877 },
    { name: "Delaware", code: "DE", latitude: 38.9108, longitude: -75.5277 },
    { name: "Floride", code: "FL", latitude: 27.6648, longitude: -81.5158 },
    { name: "Géorgie", code: "GA", latitude: 32.1656, longitude: -82.9001 },
    { name: "Hawaï", code: "HI", latitude: 19.8968, longitude: -155.5828 },
    { name: "Idaho", code: "ID", latitude: 44.0682, longitude: -114.7420 },
    { name: "Illinois", code: "IL", latitude: 40.6331, longitude: -89.3985 },
    { name: "Indiana", code: "IN", latitude: 40.2672, longitude: -86.1349 },
    { name: "Iowa", code: "IA", latitude: 41.8780, longitude: -93.0977 },
    { name: "Kansas", code: "KS", latitude: 39.0119, longitude: -98.4842 },
    { name: "Kentucky", code: "KY", latitude: 37.8393, longitude: -84.2700 },
    { name: "Louisiane", code: "LA", latitude: 30.9843, longitude: -91.9623 },
    { name: "Maine", code: "ME", latitude: 45.2538, longitude: -69.4455 },
    { name: "Maryland", code: "MD", latitude: 39.0458, longitude: -76.6413 },
    { name: "Massachusetts", code: "MA", latitude: 42.4072, longitude: -71.3824 },
    { name: "Michigan", code: "MI", latitude: 44.3148, longitude: -85.6024 },
    { name: "Minnesota", code: "MN", latitude: 46.7296, longitude: -94.6859 },
    { name: "Mississippi", code: "MS", latitude: 32.3547, longitude: -89.3985 },
    { name: "Missouri", code: "MO", latitude: 37.9643, longitude: -91.8318 },
    { name: "Montana", code: "MT", latitude: 46.8797, longitude: -110.3626 },
    { name: "Nebraska", code: "NE", latitude: 41.4925, longitude: -99.9018 },
    { name: "Nevada", code: "NV", latitude: 38.8026, longitude: -116.4194 },
    { name: "New Hampshire", code: "NH", latitude: 43.1939, longitude: -71.5724 },
    { name: "New Jersey", code: "NJ", latitude: 40.0583, longitude: -74.4057 },
    { name: "New Mexico", code: "NM", latitude: 34.5199, longitude: -105.8701 },
    { name: "New York", code: "NY", latitude: 40.7128, longitude: -74.0060 },
    { name: "Caroline du Nord", code: "NC", latitude: 35.7596, longitude: -79.0193 },
    { name: "Dakota du Nord", code: "ND", latitude: 47.5515, longitude: -101.0020 },
    { name: "Ohio", code: "OH", latitude: 40.4173, longitude: -82.9071 },
    { name: "Oklahoma", code: "OK", latitude: 35.0078, longitude: -97.0929 },
    { name: "Oregon", code: "OR", latitude: 43.8041, longitude: -120.5542 },
    { name: "Pennsylvanie", code: "PA", latitude: 41.2033, longitude: -77.1945 },
    { name: "Rhode Island", code: "RI", latitude: 41.5801, longitude: -71.4774 },
    { name: "Caroline du Sud", code: "SC", latitude: 33.8361, longitude: -81.1637 },
    { name: "Dakota du Sud", code: "SD", latitude: 43.9695, longitude: -99.9018 },
    { name: "Tennessee", code: "TN", latitude: 35.5175, longitude: -86.5804 },
    { name: "Texas", code: "TX", latitude: 31.9686, longitude: -99.9018 },
    { name: "Utah", code: "UT", latitude: 39.3210, longitude: -111.0937 },
    { name: "Vermont", code: "VT", latitude: 44.5588, longitude: -72.5778 },
    { name: "Virginie", code: "VA", latitude: 37.4316, longitude: -78.6569 },
    { name: "Washington", code: "WA", latitude: 47.7511, longitude: -120.7401 },
    { name: "Virginie-Occidentale", code: "WV", latitude: 38.5976, longitude: -80.4549 },
    { name: "Wisconsin", code: "WI", latitude: 43.7844, longitude: -88.7879 },
    { name: "Wyoming", code: "WY", latitude: 43.0760, longitude: -107.2903 },
  ],
  // Canada - Provinces et Territoires
  "CA": [
    { name: "Alberta", code: "AB", latitude: 53.9333, longitude: -116.5765 },
    { name: "Colombie-Britannique", code: "BC", latitude: 53.7267, longitude: -127.6476 },
    { name: "Manitoba", code: "MB", latitude: 53.7609, longitude: -98.8139 },
    { name: "Nouveau-Brunswick", code: "NB", latitude: 46.5653, longitude: -66.4619 },
    { name: "Terre-Neuve-et-Labrador", code: "NL", latitude: 53.1355, longitude: -57.6604 },
    { name: "Territoires du Nord-Ouest", code: "NT", latitude: 64.2823, longitude: -119.1835 },
    { name: "Nouvelle-Écosse", code: "NS", latitude: 44.6820, longitude: -63.7443 },
    { name: "Nunavut", code: "NU", latitude: 70.2998, longitude: -83.1076 },
    { name: "Ontario", code: "ON", latitude: 51.2538, longitude: -85.3232 },
    { name: "Île-du-Prince-Édouard", code: "PE", latitude: 46.5107, longitude: -63.4168 },
    { name: "Québec", code: "QC", latitude: 52.9399, longitude: -73.5491 },
    { name: "Saskatchewan", code: "SK", latitude: 52.9399, longitude: -106.4509 },
    { name: "Yukon", code: "YT", latitude: 64.2823, longitude: -135.0000 },
  ],
  // Brésil - États
  "BR": [
    { name: "Acre", code: "AC", latitude: -9.0238, longitude: -70.8120 },
    { name: "Alagoas", code: "AL", latitude: -9.5713, longitude: -36.7820 },
    { name: "Amapá", code: "AP", latitude: 1.4102, longitude: -51.7694 },
    { name: "Amazonas", code: "AM", latitude: -3.4168, longitude: -65.8561 },
    { name: "Bahia", code: "BA", latitude: -12.5797, longitude: -41.7007 },
    { name: "Ceará", code: "CE", latitude: -5.4984, longitude: -39.3206 },
    { name: "Distrito Federal", code: "DF", latitude: -15.7801, longitude: -47.9292 },
    { name: "Espírito Santo", code: "ES", latitude: -19.1834, longitude: -40.3089 },
    { name: "Goiás", code: "GO", latitude: -15.8270, longitude: -49.8362 },
    { name: "Maranhão", code: "MA", latitude: -5.4685, longitude: -45.0377 },
    { name: "Mato Grosso", code: "MT", latitude: -12.6819, longitude: -56.9211 },
    { name: "Mato Grosso do Sul", code: "MS", latitude: -20.7722, longitude: -54.7852 },
    { name: "Minas Gerais", code: "MG", latitude: -18.5122, longitude: -44.5550 },
    { name: "Pará", code: "PA", latitude: -3.4168, longitude: -52.2194 },
    { name: "Paraíba", code: "PB", latitude: -7.2400, longitude: -36.7820 },
    { name: "Paraná", code: "PR", latitude: -24.8959, longitude: -51.5542 },
    { name: "Pernambuco", code: "PE", latitude: -8.3134, longitude: -37.8600 },
    { name: "Piauí", code: "PI", latitude: -7.7183, longitude: -42.7289 },
    { name: "Rio de Janeiro", code: "RJ", latitude: -22.9068, longitude: -43.1729 },
    { name: "Rio Grande do Norte", code: "RN", latitude: -5.4026, longitude: -36.9541 },
    { name: "Rio Grande do Sul", code: "RS", latitude: -30.0346, longitude: -51.2177 },
    { name: "Rondônia", code: "RO", latitude: -10.8254, longitude: -63.3469 },
    { name: "Roraima", code: "RR", latitude: 2.7376, longitude: -62.0751 },
    { name: "Santa Catarina", code: "SC", latitude: -27.2423, longitude: -50.2189 },
    { name: "São Paulo", code: "SP", latitude: -23.5505, longitude: -46.6333 },
    { name: "Sergipe", code: "SE", latitude: -10.5741, longitude: -37.3857 },
    { name: "Tocantins", code: "TO", latitude: -10.1753, longitude: -48.2982 },
  ],
  // Chine - Provinces et Régions
  "CN": [
    { name: "Pékin", code: "BJ", latitude: 39.9042, longitude: 116.4074 },
    { name: "Shanghai", code: "SH", latitude: 31.2304, longitude: 121.4737 },
    { name: "Tianjin", code: "TJ", latitude: 39.3434, longitude: 117.3616 },
    { name: "Chongqing", code: "CQ", latitude: 29.4316, longitude: 106.9123 },
    { name: "Guangdong", code: "GD", latitude: 23.1291, longitude: 113.2644 },
    { name: "Sichuan", code: "SC", latitude: 30.6171, longitude: 102.7103 },
    { name: "Hubei", code: "HB", latitude: 30.5928, longitude: 114.3055 },
    { name: "Henan", code: "HA", latitude: 34.7617, longitude: 113.6548 },
    { name: "Shandong", code: "SD", latitude: 36.6512, longitude: 117.1201 },
    { name: "Jiangsu", code: "JS", latitude: 32.0617, longitude: 118.7778 },
    { name: "Zhejiang", code: "ZJ", latitude: 30.2741, longitude: 120.1551 },
    { name: "Hunan", code: "HN", latitude: 28.2282, longitude: 112.9388 },
    { name: "Fujian", code: "FJ", latitude: 26.0745, longitude: 119.2965 },
    { name: "Anhui", code: "AH", latitude: 31.8612, longitude: 117.2835 },
    { name: "Shaanxi", code: "SN", latitude: 34.2658, longitude: 108.9541 },
    { name: "Xinjiang", code: "XJ", latitude: 43.7929, longitude: 87.6271 },
    { name: "Tibet", code: "XZ", latitude: 29.6520, longitude: 91.1721 },
  ],
  // Inde - États et Territoires
  "IN": [
    { name: "Andhra Pradesh", code: "AP", latitude: 15.9129, longitude: 79.7400 },
    { name: "Arunachal Pradesh", code: "AR", latitude: 28.2180, longitude: 94.7278 },
    { name: "Assam", code: "AS", latitude: 26.2006, longitude: 92.9376 },
    { name: "Bihar", code: "BR", latitude: 25.0961, longitude: 85.3131 },
    { name: "Delhi", code: "DL", latitude: 28.7041, longitude: 77.1025 },
    { name: "Goa", code: "GA", latitude: 15.2993, longitude: 74.1240 },
    { name: "Gujarat", code: "GJ", latitude: 22.2587, longitude: 71.1924 },
    { name: "Haryana", code: "HR", latitude: 29.0588, longitude: 76.0856 },
    { name: "Himachal Pradesh", code: "HP", latitude: 31.1048, longitude: 77.1734 },
    { name: "Karnataka", code: "KA", latitude: 15.3173, longitude: 75.7139 },
    { name: "Kerala", code: "KL", latitude: 10.8505, longitude: 76.2711 },
    { name: "Madhya Pradesh", code: "MP", latitude: 22.9734, longitude: 78.6569 },
    { name: "Maharashtra", code: "MH", latitude: 19.7515, longitude: 75.7139 },
    { name: "Punjab", code: "PB", latitude: 31.1471, longitude: 75.3412 },
    { name: "Rajasthan", code: "RJ", latitude: 27.0238, longitude: 74.2179 },
    { name: "Tamil Nadu", code: "TN", latitude: 11.1271, longitude: 78.6569 },
    { name: "Telangana", code: "TG", latitude: 18.1124, longitude: 79.0193 },
    { name: "Uttar Pradesh", code: "UP", latitude: 26.8467, longitude: 80.9462 },
    { name: "West Bengal", code: "WB", latitude: 22.9868, longitude: 87.8550 },
  ],
  // Japon - Préfectures (principales)
  "JP": [
    { name: "Tokyo", code: "13", latitude: 35.6762, longitude: 139.6503 },
    { name: "Osaka", code: "27", latitude: 34.6937, longitude: 135.5023 },
    { name: "Kyoto", code: "26", latitude: 35.0116, longitude: 135.7681 },
    { name: "Hokkaido", code: "01", latitude: 43.0642, longitude: 141.3469 },
    { name: "Aichi", code: "23", latitude: 35.1802, longitude: 136.9066 },
    { name: "Fukuoka", code: "40", latitude: 33.5902, longitude: 130.4017 },
    { name: "Kanagawa", code: "14", latitude: 35.4478, longitude: 139.6425 },
    { name: "Saitama", code: "11", latitude: 35.8617, longitude: 139.6455 },
    { name: "Chiba", code: "12", latitude: 35.6073, longitude: 140.1063 },
    { name: "Hiroshima", code: "34", latitude: 34.3966, longitude: 132.4596 },
    { name: "Okinawa", code: "47", latitude: 26.2124, longitude: 127.6809 },
  ],
  // Australie - États et Territoires
  "AU": [
    { name: "Nouvelle-Galles du Sud", code: "NSW", latitude: -33.8688, longitude: 151.2093 },
    { name: "Victoria", code: "VIC", latitude: -37.8136, longitude: 144.9631 },
    { name: "Queensland", code: "QLD", latitude: -27.4698, longitude: 153.0251 },
    { name: "Australie-Occidentale", code: "WA", latitude: -31.9505, longitude: 115.8605 },
    { name: "Australie-Méridionale", code: "SA", latitude: -34.9285, longitude: 138.6007 },
    { name: "Tasmanie", code: "TAS", latitude: -42.8821, longitude: 147.3272 },
    { name: "Territoire du Nord", code: "NT", latitude: -12.4634, longitude: 130.8456 },
    { name: "Territoire de la capitale australienne", code: "ACT", latitude: -35.2809, longitude: 149.1300 },
  ],
  // Royaume-Uni - Nations et Régions
  "GB": [
    { name: "Angleterre", code: "ENG", latitude: 52.3555, longitude: -1.1743 },
    { name: "Écosse", code: "SCT", latitude: 56.4907, longitude: -4.2026 },
    { name: "Pays de Galles", code: "WLS", latitude: 52.1307, longitude: -3.7837 },
    { name: "Irlande du Nord", code: "NIR", latitude: 54.7877, longitude: -6.4923 },
    { name: "Grand Londres", code: "LND", latitude: 51.5074, longitude: -0.1278 },
    { name: "Sud-Est", code: "SE", latitude: 51.3015, longitude: 0.7385 },
    { name: "Sud-Ouest", code: "SW", latitude: 50.9601, longitude: -3.2206 },
    { name: "Yorkshire et Humber", code: "YH", latitude: 53.9591, longitude: -1.0815 },
    { name: "Midlands de l'Ouest", code: "WM", latitude: 52.4862, longitude: -1.8904 },
    { name: "Nord-Ouest", code: "NW", latitude: 53.4808, longitude: -2.2426 },
  ],
  // Espagne - Communautés autonomes
  "ES": [
    { name: "Andalousie", code: "AN", latitude: 37.3891, longitude: -5.9845 },
    { name: "Aragon", code: "AR", latitude: 41.6488, longitude: -0.8891 },
    { name: "Asturies", code: "AS", latitude: 43.3614, longitude: -5.8593 },
    { name: "Îles Baléares", code: "IB", latitude: 39.5696, longitude: 2.6502 },
    { name: "Pays basque", code: "PV", latitude: 42.9896, longitude: -2.6189 },
    { name: "Îles Canaries", code: "CN", latitude: 28.2916, longitude: -16.6291 },
    { name: "Cantabrie", code: "CB", latitude: 43.1828, longitude: -3.9878 },
    { name: "Castille-La Manche", code: "CM", latitude: 39.8628, longitude: -4.0273 },
    { name: "Castille-et-León", code: "CL", latitude: 41.8357, longitude: -4.3976 },
    { name: "Catalogne", code: "CT", latitude: 41.5912, longitude: 1.5209 },
    { name: "Estrémadure", code: "EX", latitude: 39.1636, longitude: -6.1344 },
    { name: "Galice", code: "GA", latitude: 42.5751, longitude: -8.1339 },
    { name: "Madrid", code: "MD", latitude: 40.4168, longitude: -3.7038 },
    { name: "Murcie", code: "MC", latitude: 37.9922, longitude: -1.1307 },
    { name: "Navarre", code: "NC", latitude: 42.6954, longitude: -1.6761 },
    { name: "La Rioja", code: "RI", latitude: 42.2871, longitude: -2.5396 },
    { name: "Communauté valencienne", code: "VC", latitude: 39.4840, longitude: -0.7533 },
  ],
  // Italie - Régions
  "IT": [
    { name: "Abruzzes", code: "65", latitude: 42.3535, longitude: 13.3919 },
    { name: "Basilicate", code: "77", latitude: 40.6393, longitude: 15.8018 },
    { name: "Calabre", code: "78", latitude: 38.9105, longitude: 16.5880 },
    { name: "Campanie", code: "72", latitude: 40.8518, longitude: 14.2681 },
    { name: "Émilie-Romagne", code: "45", latitude: 44.4949, longitude: 11.3426 },
    { name: "Frioul-Vénétie Julienne", code: "36", latitude: 45.6495, longitude: 13.7768 },
    { name: "Latium", code: "62", latitude: 41.9028, longitude: 12.4964 },
    { name: "Ligurie", code: "42", latitude: 44.4056, longitude: 8.9463 },
    { name: "Lombardie", code: "25", latitude: 45.4654, longitude: 9.1859 },
    { name: "Marches", code: "57", latitude: 43.6158, longitude: 13.5189 },
    { name: "Molise", code: "67", latitude: 41.5608, longitude: 14.6684 },
    { name: "Piémont", code: "21", latitude: 45.0703, longitude: 7.6869 },
    { name: "Pouilles", code: "75", latitude: 41.1253, longitude: 16.8620 },
    { name: "Sardaigne", code: "88", latitude: 40.1209, longitude: 9.0129 },
    { name: "Sicile", code: "82", latitude: 37.5994, longitude: 14.0154 },
    { name: "Toscane", code: "52", latitude: 43.7711, longitude: 11.2486 },
    { name: "Trentin-Haut-Adige", code: "32", latitude: 46.4993, longitude: 11.3561 },
    { name: "Ombrie", code: "55", latitude: 42.7299, longitude: 12.3891 },
    { name: "Vallée d'Aoste", code: "23", latitude: 45.7375, longitude: 7.3206 },
    { name: "Vénétie", code: "34", latitude: 45.4408, longitude: 12.3155 },
  ],
  // RDC - Provinces
  "CD": [
    { name: "Kinshasa", code: "KN", latitude: -4.4419, longitude: 15.2663 },
    { name: "Bas-Uele", code: "BU", latitude: 3.5000, longitude: 23.5000 },
    { name: "Équateur", code: "EQ", latitude: 1.0000, longitude: 21.5000 },
    { name: "Haut-Katanga", code: "HK", latitude: -10.0000, longitude: 27.5000 },
    { name: "Haut-Lomami", code: "HL", latitude: -8.0000, longitude: 24.0000 },
    { name: "Haut-Uele", code: "HU", latitude: 4.5000, longitude: 28.5000 },
    { name: "Ituri", code: "IT", latitude: 2.0000, longitude: 29.5000 },
    { name: "Kasaï", code: "KS", latitude: -5.0000, longitude: 21.0000 },
    { name: "Kasaï-Central", code: "KC", latitude: -5.5000, longitude: 22.5000 },
    { name: "Kasaï-Oriental", code: "KE", latitude: -6.0000, longitude: 24.0000 },
    { name: "Kongo-Central", code: "BC", latitude: -5.5000, longitude: 14.0000 },
    { name: "Kwango", code: "KG", latitude: -5.5000, longitude: 17.5000 },
    { name: "Kwilu", code: "KL", latitude: -5.0000, longitude: 18.5000 },
    { name: "Lomami", code: "LO", latitude: -4.5000, longitude: 24.5000 },
    { name: "Lualaba", code: "LU", latitude: -10.0000, longitude: 25.5000 },
    { name: "Mai-Ndombe", code: "MN", latitude: -2.5000, longitude: 18.0000 },
    { name: "Maniema", code: "MA", latitude: -3.0000, longitude: 26.5000 },
    { name: "Mongala", code: "MO", latitude: 2.0000, longitude: 21.5000 },
    { name: "Nord-Kivu", code: "NK", latitude: -1.0000, longitude: 29.0000 },
    { name: "Nord-Ubangi", code: "NU", latitude: 3.5000, longitude: 21.5000 },
    { name: "Sankuru", code: "SA", latitude: -4.0000, longitude: 23.5000 },
    { name: "Sud-Kivu", code: "SK", latitude: -3.0000, longitude: 28.5000 },
    { name: "Sud-Ubangi", code: "SU", latitude: 3.0000, longitude: 19.5000 },
    { name: "Tanganyika", code: "TA", latitude: -6.5000, longitude: 28.0000 },
    { name: "Tshopo", code: "TO", latitude: 1.0000, longitude: 25.5000 },
    { name: "Tshuapa", code: "TU", latitude: -0.5000, longitude: 22.0000 },
  ],
  // Afrique du Sud - Provinces
  "ZA": [
    { name: "Cap-Occidental", code: "WC", latitude: -33.9249, longitude: 18.4241 },
    { name: "Cap-Oriental", code: "EC", latitude: -32.2968, longitude: 26.4194 },
    { name: "Cap-du-Nord", code: "NC", latitude: -29.0852, longitude: 21.8569 },
    { name: "État-Libre", code: "FS", latitude: -29.0852, longitude: 26.1596 },
    { name: "KwaZulu-Natal", code: "KZN", latitude: -28.5306, longitude: 30.8958 },
    { name: "Gauteng", code: "GT", latitude: -26.2041, longitude: 28.0473 },
    { name: "Mpumalanga", code: "MP", latitude: -25.5653, longitude: 30.5279 },
    { name: "Limpopo", code: "LP", latitude: -23.4013, longitude: 29.4179 },
    { name: "Nord-Ouest", code: "NW", latitude: -26.6639, longitude: 25.4753 },
  ],
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting world regions import...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let countriesCreated = 0;
    let countriesUpdated = 0;
    let regionsCreated = 0;
    let regionsUpdated = 0;
    const errors: string[] = [];

    // Step 1: Import/Update countries
    console.log("Importing countries...");
    for (const country of COUNTRIES_DATA) {
      try {
        // Check if country exists by ISO2 code
        const { data: existing } = await supabase
          .from('countries')
          .select('id')
          .eq('code_iso2', country.code_iso2)
          .single();

        if (existing) {
          // Update existing country
          const { error } = await supabase
            .from('countries')
            .update({
              name: country.name,
              code: country.code_iso2,
              code_iso3: country.code_iso3,
            })
            .eq('id', existing.id);
          
          if (error) throw error;
          countriesUpdated++;
        } else {
          // Insert new country
          const { error } = await supabase
            .from('countries')
            .insert({
              name: country.name,
              code: country.code_iso2,
              code_iso2: country.code_iso2,
              code_iso3: country.code_iso3,
            });
          
          if (error) throw error;
          countriesCreated++;
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error processing country ${country.name}:`, err);
        errors.push(`Country ${country.name}: ${errorMessage}`);
      }
    }

    console.log(`Countries: ${countriesCreated} created, ${countriesUpdated} updated`);

    // Step 2: Import/Update regions
    console.log("Importing regions...");
    for (const [countryIso2, regions] of Object.entries(REGIONS_DATA)) {
      // Get country ID
      const { data: country, error: countryError } = await supabase
        .from('countries')
        .select('id')
        .eq('code_iso2', countryIso2)
        .single();

      if (countryError || !country) {
        console.error(`Country not found for ISO2: ${countryIso2}`);
        errors.push(`Country not found: ${countryIso2}`);
        continue;
      }

      for (const region of regions) {
        try {
          // Check if region exists by name and country
          const { data: existing } = await supabase
            .from('regions')
            .select('id')
            .eq('name', region.name)
            .eq('country_id', country.id)
            .single();

          if (existing) {
            // Update existing region
            const { error } = await supabase
              .from('regions')
              .update({
                code: region.code || null,
                latitude: region.latitude,
                longitude: region.longitude,
              })
              .eq('id', existing.id);
            
            if (error) throw error;
            regionsUpdated++;
          } else {
            // Insert new region
            const { error } = await supabase
              .from('regions')
              .insert({
                name: region.name,
                code: region.code || null,
                country_id: country.id,
                latitude: region.latitude,
                longitude: region.longitude,
                is_active: true,
              });
            
            if (error) throw error;
            regionsCreated++;
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(`Error processing region ${region.name}:`, err);
          errors.push(`Region ${region.name} (${countryIso2}): ${errorMessage}`);
        }
      }
    }

    console.log(`Regions: ${regionsCreated} created, ${regionsUpdated} updated`);

    const result = {
      success: true,
      summary: {
        countries: {
          created: countriesCreated,
          updated: countriesUpdated,
          total: countriesCreated + countriesUpdated,
        },
        regions: {
          created: regionsCreated,
          updated: regionsUpdated,
          total: regionsCreated + regionsUpdated,
        },
      },
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Import completed:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Import error:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
