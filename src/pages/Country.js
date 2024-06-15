import React, { useState, useRef } from "react";
import axios from "axios";
import { getCode } from "country-list";

const Country = () => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const rapidapiKey = process.env.REACT_APP_RAPIDAPI_KEY;
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const debounceTimeoutRef = useRef(null);

  const handleSearch = async (input, page, perPage) => {
    const countryCode = getCode(input.trim());
    setMessage("Start Searching...");

    if (!countryCode) {
      setResults([]);
      setTotalPages(0);

      setTimeout(() => {
        setMessage("No result found");
      }, 200);
      return;
    }

    const options = {
      method: "GET",
      url: apiUrl,
      params: {
        countryIds: countryCode,
        limit: perPage,
        offset: (page - 1) * perPage,
      },
      headers: {
        "x-rapidapi-host": "wft-geo-db.p.rapidapi.com",
        "x-rapidapi-key": rapidapiKey,
      },
    };

    try {
      const response = await axios.request(options);
      if (response.data.data.length === 0) {
        setMessage("No result found");
      } else {
        setResults(response.data.data);
        setTotalPages(Math.ceil(response.data.metadata.totalCount / perPage));
      }
    } catch (error) {
      setMessage("Error fetching data");
    } finally {
      setMessage("");
    }
  };

  const debounce = (func, delay) => {
    return function (...args) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const debouncedHandleSearch = useRef(debounce(handleSearch, 600)).current;

  const handleInputChange = (event) => {
    setSearchInput(event.target.value);
    setCurrentPage(1);
    debouncedHandleSearch(event.target.value, 1, perPage);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    handleSearch(searchInput, page, perPage);
  };

  const handlePerPageChange = (event) => {
    const newPerPage = parseInt(event.target.value, 10);
    if (!isNaN(newPerPage) && newPerPage >= 1 && newPerPage <= 10) {
      setPerPage(newPerPage);
      setCurrentPage(1);
      handleSearch(searchInput, 1, newPerPage);
    }
  };

  const renderFlag = (countryId) => {
    if (!countryId) {
      return "No flag";
    }
    return (
      <img
        src={`https://flagsapi.com/${countryId}/flat/64.png`}
        alt={`${countryId} flag`}
        width="30px"
        className="flag-img"
      />
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) {
      return null;
    }

    return (
      <nav aria-label="Pagination">
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
          </li>
          <li
            className={`page-item ${
              currentPage === totalPages ? "disabled" : ""
            }`}
          >
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="main">
      <div className="search">
        <input
          type="text"
          className="searchbox"
          placeholder="Search places"
          value={searchInput}
          onChange={handleInputChange}
        />
      </div>

      <div className="table-main">
        {message ? (
          <div className="spinner">{message}</div>
        ) : (
          <table className="table table-hover table-bordered">
            <thead>
              <tr>
                <th>#</th>
                <th>Place Name</th>
                <th>Region</th>
                <th>Population</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {results.map((city, index) => (
                <tr key={city.id}>
                  <td>{(currentPage - 1) * perPage + index + 1}</td>
                  <td>{city.name}</td>
                  <td>{city.region}</td>
                  <td>{city.population}</td>
                  <td>
                    <div className="flag-main">
                      <span>{city.country}</span>
                      {renderFlag(city.countryCode)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {results.length > 0 && (
          <div className="pagination-container">
            <div className="user-input">
              <label htmlFor="perPageInput">Cities per page (1 - 10):</label>
              <input
                type="number"
                id="perPageInput"
                value={perPage}
                onChange={handlePerPageChange}
                min="1"
                max="10"
              />
            </div>
            {renderPagination()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Country;
