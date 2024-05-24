import React, { useState } from 'react';
import './App.css';
import { Analytics } from "@vercel/analytics/react"

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


function extractWavefrontSubqueries(query) {
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

// Function to extract Prometheus subqueries
function extractPrometheusSubqueries(query) {
  const subqueries = [];
  const regex = /[a-zA-Z_:][a-zA-Z0-9_:]*\{[^}]*\}/g;
  let match;

  while ((match = regex.exec(query)) !== null) {
    subqueries.push(match[0]);
  }

  return subqueries;
}


function replaceDotsAndHyphens(query) {
  return query.replace(/ts\("([^"]+?)"/g, (match, metric) => {
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

function prettifyQuery(query) {
  let indentLevel = 0;
  const indent = '  ';
  let formattedQuery = '';
  let i = 0;

  while (i < query.length) {
    const char = query[i];

    if (char === '(') {
      formattedQuery += char + '\n';
      indentLevel++;
      formattedQuery += indent.repeat(indentLevel);
    } else if (char === ')') {
      formattedQuery += '\n';
      indentLevel--;
      formattedQuery += indent.repeat(indentLevel) + char;
    } else {
      formattedQuery += char;
    }

    i++;
  }

  return formattedQuery;
}

function minifyQuery(query) {
  return query.replace(/\s+/g, ' ').replace(/\n/g, '');
}

function App() {
  const [input, setInput] = useState('');
  const [queries, setQueries] = useState([]);
  const [simplifiedQuery, setSimplifiedQuery] = useState('');
  const [showValues, setShowValues] = useState(false);
  const [queryType, setQueryType] = useState('wavefront');


  const handleSubmit = (event) => {
    event.preventDefault();
    let extractedSubqueries = [];
    if (queryType === 'wavefront') {
      extractedSubqueries = extractWavefrontSubqueries(input);
    } else if (queryType === 'prometheus') {
      extractedSubqueries = extractPrometheusSubqueries(input);
    }

    // const extractedQueries = extractSubqueries(input);
    setQueries(extractedSubqueries);
    const simplified = generateSimplifiedQuery(input, extractedSubqueries);
    setSimplifiedQuery(simplified);
  };


  // const handleExtractQueries = () => {
  //   let extractedSubqueries = [];
  //   if (queryType === 'wavefront') {
  //     extractedSubqueries = extractWavefrontSubqueries(inputQuery);
  //   } else if (queryType === 'prometheus') {
  //     extractedSubqueries = extractPrometheusSubqueries(inputQuery);
  //   }
  //   setSubqueries(extractedSubqueries);
  //
  //   let simplified = inputQuery;
  //   extractedSubqueries.forEach((subquery, index) => {
  //     const placeholder = `\${Q${index + 1}}`;
  //     simplified = simplified.replace(subquery, placeholder);
  //   });
  //   setSimplifiedQuery(simplified);
  // };

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

  const handlePrettify = () => {
    const prettyQuery = prettifyQuery(simplifiedQuery);
    setSimplifiedQuery(prettyQuery);
  };

  const handleMinify = () => {
    const minifiedQuery = minifyQuery(simplifiedQuery);
    setSimplifiedQuery(minifiedQuery);
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
            <div className="radio-buttons">
              <label>
                <input
                    type="radio"
                    value="wavefront"
                    checked={queryType === 'wavefront'}
                    onChange={() => setQueryType('wavefront')}
                />
                Wavefront
              </label>
              <label>
                <input
                    type="radio"
                    value="prometheus"
                    checked={queryType === 'prometheus'}
                    onChange={() => setQueryType('prometheus')}
                />
                Prometheus
              </label>
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
                  {queryType === 'wavefront' && (
                      <button onClick={() => handleReplaceDotsAndHyphens(index)}>
                        Replace Dots and Hyphens
                      </button>
                  )}
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
                rows="10"
                cols="50"
                onChange={(e) => setSimplifiedQuery(e.target.value)}
                style={{ resize: 'vertical' }}

            />
            <button onClick={toggleShowValues}>
              {showValues ? 'Show Placeholders' : 'Show Values'}
            </button>
            <button onClick={handlePrettify}>Prettify</button>
            <button onClick={handleMinify}>Minify</button>
          </div>
        </main>
        <Analytics />
      </div>
  );
}

export default App;
