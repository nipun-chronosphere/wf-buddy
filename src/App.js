// src/App.js
import React, { useState } from 'react';
import './App.css';

function extractSubqueries(query) {
  const subqueries = [];
  const stack = [];
  let startIndex = -1;
  let inTS = false;

  for (let i = 0; i < query.length; i++) {
    if (query.substr(i, 3) === 'ts(') {
      if (!inTS) {
        startIndex = i;
        inTS = true;
      }
      stack.push('(');
      i += 2; // Skip "ts("
    } else if (query[i] === '(' && inTS) {
      stack.push('(');
    } else if (query[i] === ')' && inTS) {
      stack.pop();
      if (stack.length === 0) {
        subqueries.push(query.substring(startIndex, i + 1));
        inTS = false;
      }
    }
  }

  return subqueries;
}

function replaceDotsAndHyphens(query) {
  return query.replace(/ts\("([^"]+?)"/, (match, metric) => {
    const updatedMetric = metric.replace(/[.-]/g, '_');
    return `ts("${updatedMetric}"`;
  });
}

function generateSimplifiedQuery(query, subqueries) {
  let simplifiedQuery = query;
  subqueries.forEach((subquery, index) => {
    const placeholder = `\${Q${index + 1}}`;
    simplifiedQuery = simplifiedQuery.replace(subquery, placeholder);
  });
  return simplifiedQuery;
}

function App() {
  const [input, setInput] = useState('');
  const [queries, setQueries] = useState([]);
  const [simplifiedQuery, setSimplifiedQuery] = useState('');
  const [showValues, setShowValues] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const extractedQueries = extractSubqueries(input);
    setQueries(extractedQueries);
    const simplified = generateSimplifiedQuery(input, extractedQueries);
    setSimplifiedQuery(simplified);
  };

  const handleReplaceDotsAndHyphens = (index) => {
    const updatedQueries = queries.map((query, i) =>
        i === index ? replaceDotsAndHyphens(query) : query
    );
    setQueries(updatedQueries);
  };

  const handleQueryChange = (index, newQuery) => {
    const updatedQueries = queries.map((query, i) =>
        i === index ? newQuery : query
    );
    setQueries(updatedQueries);
  };

  const toggleShowValues = () => {
    setShowValues(!showValues);
  };

  return (
      <div className="App">
        <header className="App-header">
          <h1>wf-buddy</h1>
        </header>
        <main>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="queryInput">Input Query:</label>
              <textarea
                  id="queryInput"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows="10"
                  cols="50"
              />
            </div>
            <button type="submit">Extract Queries</button>
          </form>
          <div>
            {queries.map((query, index) => (
                <div key={index} className="query-box">
                  <label>Q{index + 1}:</label>
                  <textarea
                      value={query}
                      onChange={(e) => handleQueryChange(index, e.target.value)}
                      rows="3"
                      cols="50"
                  />
                  <button onClick={() => handleReplaceDotsAndHyphens(index)}>
                    Replace Dots and Hyphens
                  </button>
                </div>
            ))}
          </div>
          <div className="simplified-query-box">
            <label>Simplified Query:</label>
            <textarea
                value={showValues ? simplifiedQuery.replace(/\${Q\d+}/g, (match) => {
                  const index = parseInt(match.slice(3, -1)) - 1;
                  return queries[index];
                }) : simplifiedQuery}
                readOnly
                rows="10"
                cols="50"
            />
            <button onClick={toggleShowValues}>
              {showValues ? 'Show Placeholders' : 'Show Values'}
            </button>
          </div>
        </main>
      </div>
  );
}

export default App;
