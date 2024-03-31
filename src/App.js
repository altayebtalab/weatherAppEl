import { useEffect, useRef, useState, useCallback } from 'react';

function getWeatherIcon(wmoCode) {
	const icons = new Map([
		[[0], '☀️'],
		[[1], '🌤'],
		[[2], '⛅️'],
		[[3], '☁️'],
		[[45, 48], '🌫'],
		[[51, 56, 61, 66, 80], '🌦'],
		[[53, 55, 63, 65, 57, 67, 81, 82], '🌧'],
		[[71, 73, 75, 77, 85, 86], '🌨'],
		[[95], '🌩'],
		[[96, 99], '⛈'],
	]);
	const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
	if (!arr) return 'NOT FOUND';
	const icon = icons.get(arr);
	return icon;
}

// getWeatherIcon(80);

export default function App() {
	const [location, setLocation] = useState('');
	const [weatherData, setWeatherData] = useState({});
	const [locationData, setLocationData] = useState();
	const [city, setCity] = useState('');
	const [isLoading, setIsLoading] = useState();
	const [timezone, setTimezone] = useState();
	const inputEl = useRef(null);
	const dateToday = new Date();
	const myLocale = navigator.language;
	let minutes = dateToday.getMinutes();

	minutes = minutes < 10 ? '0' + minutes : minutes;
	function handleSearch(city) {
		setCity(city);
	}

	const handleBtn = useCallback(() => {
		setLocation(city);
		// console.log(locationData.name);
	}, [city]);

	function convertToFlag(countryCode) {
		const codePoints = countryCode
			.toUpperCase()
			.split('')
			.map((char) => 127397 + char.charCodeAt());
		return String.fromCodePoint(...codePoints);
	}

	useEffect(
		function () {
			const controller = new AbortController();
			async function fetchWeather() {
				try {
					setIsLoading(true);
					const res = await fetch(
						`https://geocoding-api.open-meteo.com/v1/search?name=${location},`,
						{ signal: controller.signal }
					);

					const geoLocation = await res.json();
					// console.log(geoLocation);
					setLocationData(geoLocation.results[0]);

					const { latitude, longitude, timezone, name, country_code, country } =
						geoLocation.results.at(0);
					console.log(`${name} ${convertToFlag(country_code)}`);

					const weatherRes = await fetch(
						`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
					);
					const data = await weatherRes.json();
					setWeatherData(data.daily);
					setTimezone(data.timezone_abbreviation);
					console.log(data);
				} catch (err) {
					if (err.name !== 'AbortError') console.error(err.message);
				} finally {
					setIsLoading(false);
				}
			}

			if (location.length < 2) {
				setLocation('');
				return;
			}
			fetchWeather();
			return function () {
				controller.abort();
			};
		},
		[location]
	);

	useEffect(
		function () {
			function callback(e) {
				if (e.code === 'Enter') {
					inputEl.current.blur();
					handleBtn();
				}
			}
			document.addEventListener('keydown', callback);
		},
		[handleBtn]
	);

	return (
		<div className="app">
			<h1>Weather Forecast App</h1>
			<div>
				<input
					onChange={(e) => handleSearch(e.target.value)}
					placeholder="Enter city name"
					ref={inputEl}
					disabled={isLoading}></input>
			</div>
			<button onClick={handleBtn}>Get Weather</button>
			<p>
				{locationData && `${locationData?.name} (${locationData?.country})`}
			</p>
			{isLoading ? <Loader /> : <Weather weatherData={weatherData} />}
			<p>{locationData && `Local Time ${dateToday.getHours()}:${minutes} `}</p>
		</div>
	);
}

function Loader() {
	return <div>Loading..</div>;
}

function Weather({ weatherData }) {
	const date = new Date();
	const dayToday = date.getDay();
	let num = 0;
	const days = {
		0: 'sun',
		1: 'mon',
		2: 'tue',
		3: 'wed',
		4: 'thu',
		5: 'fri',
		6: 'sat',
	};

	return (
		<ul className="weather">
			{weatherData.weathercode?.map((code, i) => (
				<Day key={i}>
					<p>
						{i === 0
							? 'today'
							: dayToday + i <= 6
							? days[dayToday + i]
							: days[num++]}
					</p>
					<div>{getWeatherIcon(code)}</div>
					<div>
						{weatherData.temperature_2m_max[i]}&deg;/
						{weatherData.temperature_2m_min[i]}&deg;C
					</div>
				</Day>
			))}
		</ul>
	);
}

function Day({ children }) {
	return <li className="day">{children}</li>;
}
