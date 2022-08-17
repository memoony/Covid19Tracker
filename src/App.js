import { FormControl, Select, MenuItem, Card, CardContent } from '@material-ui/core';
import { useEffect, useState } from 'react';
import './App.css';

//* Components
import InfoBox from "./components/InfoBox";
import LineGraph from './components/LineGraph';
import Map from "./components/Map";
import Table from "./components/Table";

//* Pipes
import { prettyPrintStat, sortData } from "./pipes/Util";

//* React Leaflet CSS
import "leaflet/dist/leaflet.css";

function App() {

  const baseUrl = "https://disease.sh/v3/covid-19";

  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState("worldwide");
  const [countryInfo, setCountryInfo] = useState({});
  const [tableData, setTableData] = useState([]);
  const [mapCenter, setMapCenter] = useState({ lat: 34.80746, lng: -40.4796 });
  const [mapZoom, setMapZoom] = useState(3);
  const [mapCountries, setMapCountries] = useState([]);
  const [casesType, setCasesType] = useState("cases");

  useEffect(() => {
    fetch(baseUrl + "/all")
      .then((response) => response.json())
      .then((data) => {
        setCountryInfo(data);
      });
  }, []);

  useEffect(() => {
    const getCountriesData = async () => {
      await fetch(baseUrl + "/countries")
        .then((response) => response.json())
        .then((data) => {
          const countries = data.map((country) => ({
            name: country.country, // Turkey, United States etc.
            value: country.countryInfo.iso2 // TR, US etc.
          }));


          const sortedData = sortData(data); //* data listesini sortData metoduna (pipe) gönderir ve "cases" değerine göre kontrol ederek sıralar. Bunu da sortedData değişkenine aktarır.
          setTableData(sortedData); //* sortedData verisini setTableData metoduna gönderir ve verilerin tableData dizisine set edilmesi sağlanır.
          setMapCountries(data);
          setCountries(countries);
        });
    };

    getCountriesData();
  }, []);

  const onCountryChange = async (event) => {
    const countryCode = event.target.value;
    let url = "";

    if (countryCode === "worldwide") {
      url = baseUrl + "/all";
      setMapCenter([34.80746, -40.4796]);
      setMapZoom(3);
    } else {
      url = baseUrl + "/countries/" + countryCode;
    }

    await fetch(url)
      .then((response) => response.json())
      .then((data) => {
        setCountry(countryCode);

        // All of the data from the country response.
        setCountryInfo(data);

        setMapCenter([data.countryInfo.lat, data.countryInfo.long]);
        setMapZoom(4);
      })
  };

  return (
    <div className="app">
      <div className="app__left">
        <div className="app__header">
          <h1>COVID-19 Tracker</h1>
          <FormControl className="app__dropdown">
            <Select variant="outlined" onChange={onCountryChange} value={country}>
              <MenuItem value="worldwide">Worldwide</MenuItem>
              {
                countries.map((country) => (
                  <MenuItem value={country.value}>{country.name}</MenuItem>
                ))
              }
            </Select>
          </FormControl>
        </div>

        <div className="app__stats">
          <InfoBox
            isRed
            active={casesType === "cases"}
            onClick={(e) => setCasesType("cases")}
            title="Coronavirus Cases"
            cases={prettyPrintStat(countryInfo.todayCases)}
            total={prettyPrintStat(countryInfo.cases)}
          />
          <InfoBox
            active={casesType === "recovered"}
            onClick={(e) => setCasesType("recovered")}
            title="Recovered"
            cases={prettyPrintStat(countryInfo.todayRecovered)}
            total={prettyPrintStat(countryInfo.recovered)}
          />
          <InfoBox
            isRed
            active={casesType === "deaths"}
            onClick={(e) => setCasesType("deaths")}
            title="Deaths"
            cases={prettyPrintStat(countryInfo.todayDeaths)}
            total={prettyPrintStat(countryInfo.deaths)}
          />
        </div>

        <Map
          casesType={casesType}
          countries={mapCountries}
          center={mapCenter}
          zoom={mapZoom}
        />
      </div>
      <Card className="app__right">
        <CardContent>
          <h3>Live Cases by Country</h3>
          <Table countries={tableData} />
          <h3 className="app__graphTitle">Worldwide New {casesType}</h3>
          <LineGraph className="app__graph" casesType={casesType} />
        </CardContent>
      </Card>
    </div>
  );
}

export default App;