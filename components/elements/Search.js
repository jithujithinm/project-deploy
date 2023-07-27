import React, { useState } from 'react';
import Link from 'next/link';


const Search = () => {
  const [isToggled, setToggled] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const toggleTrueFalse = () => {
    setToggled(!isToggled);
  };

  const handleServiceChange = (e) => {
    setSelectedService(e.target.value);
  };

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };

  const handleSearch = async () => {
    try {
      const response = await fetch('/api/Display', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: selectedService,
          location: selectedLocation,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results);
      } else {
        console.error('Search request failed');
      }
    } catch (error) {
      console.error('Search request failed', error);
    }
  };

  return (
    <>
      <div class="container mt-70">
    <div class="text-center mt-10">
      <div class="image-search-form">
        <select value="" onchange="">
          <option value="">Service</option>
          {/* <option value="Car Modifications">Car Modifications</option>
          <option value="Customer service">Customer service</option>
          <option value="eee">eee</option> */}
          {/* Add your service options */}
        </select>
        <select value="" onchange="">
          <option value="">Location</option>
          {/* <option value="kannur">kannur</option>
          <option value="idukki">idukki</option>
          <option value="eee">eee</option> */}
          {/* Add your location options */}
        </select>
        <button onclick="" class='icon-arrow-right-white'>Search</button>
      </div>
    </div>
    <div class="card-row">
      {/* Display search results as Bootstrap cards */}
      {/* {searchResults.map((result) => (
        <div key={result.id} class="card">
          <div class="card-body">
            <h5 class="card-title">{result.title}</h5>
            <img src={`/assets/uploads/${result.image}`} alt={result.title} class="card-img" />
            <a href={`/details/${result.id}`}>
              <button class="get-started-link icon-arrow-right">Get Started</button>
            </a>
          </div>
        </div>
      ))} */}
    </div>
  </div>
    </>
  );
};

export default Search;
