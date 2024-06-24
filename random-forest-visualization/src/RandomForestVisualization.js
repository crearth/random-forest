import React, { useState, useEffect } from 'react';

const DecisionTree = ({ treeData, sampleData, onPredict }) => {
  const [highlightedPath, setHighlightedPath] = useState([]);

  useEffect(() => {
    const path = [];
    let currentNode = treeData;
    while (currentNode.children) {
      path.push(currentNode.id);
      const feature = currentNode.feature;
      const value = sampleData[feature];
      currentNode = value > currentNode.threshold ? currentNode.children[1] : currentNode.children[0];
    }
    path.push(currentNode.id);
    setHighlightedPath(path);
    onPredict(currentNode.prediction);
  }, [treeData, sampleData, onPredict]);

  const renderNode = (node, x, y, level) => {
    const isHighlighted = highlightedPath.includes(node.id);
    if (node.children) {
      const nextY = y + 60;
      const gap = 160 / (2 ** level);
      return (
        <g key={node.id}>
          <circle cx={x} cy={y} r="20" fill={isHighlighted ? "#ffd700" : "white"} stroke="black" />
          <text x={x} y={y} textAnchor="middle" alignmentBaseline="middle" fontSize="10">
            {`${node.feature} > ${node.threshold}`}
          </text>
          <line x1={x} y1={y + 20} x2={x - gap} y2={nextY - 20} stroke={isHighlighted ? "red" : "black"} />
          <line x1={x} y1={y + 20} x2={x + gap} y2={nextY - 20} stroke={isHighlighted ? "red" : "black"} />
          {renderNode(node.children[0], x - gap, nextY, level + 1)}
          {renderNode(node.children[1], x + gap, nextY, level + 1)}
        </g>
      );
    } else {
      return (
        <g key={node.id}>
          <rect x={x - 30} y={y - 15} width="60" height="30" fill={isHighlighted ? "#90EE90" : "white"} stroke="black" />
          <text x={x} y={y} textAnchor="middle" alignmentBaseline="middle" fontSize="12">
            {node.prediction}
          </text>
        </g>
      );
    }
  };

  return (
    <svg width="320" height="300">
      {renderNode(treeData, 160, 30, 1)}
    </svg>
  );
};

const generateTree = (depth, features) => {
  if (depth === 0) {
    return { id: Math.random().toString(36).substr(2, 9), prediction: Math.random() > 0.5 ? 'Sunny' : 'Rainy' };
  }
  const node = {
    id: Math.random().toString(36).substr(2, 9),
    feature: features[Math.floor(Math.random() * features.length)],
    threshold: Math.floor(Math.random() * 100),
    children: [
      generateTree(depth - 1, features),
      generateTree(depth - 1, features)
    ]
  };
  return node;
};

const RandomForestVisualization = () => {
  const [treeCount, setTreeCount] = useState(3);
  const features = ['Temperature', 'Humidity', 'Wind Speed'];
  const [sampleData, setSampleData] = useState({ Temperature: 25, Humidity: 60, 'Wind Speed': 10 });
  const [forest, setForest] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [finalPrediction, setFinalPrediction] = useState(null);

  useEffect(() => {
    setForest(Array(treeCount).fill(0).map(() => generateTree(3, features)));
  }, [treeCount]);

  const updateFeature = (feature, value) => {
    setSampleData(prev => ({ ...prev, [feature]: parseInt(value) }));
  };

  const handlePredict = (treeIndex, prediction) => {
    setPredictions(prev => {
      const newPredictions = [...prev];
      newPredictions[treeIndex] = prediction;
      return newPredictions;
    });
  };

  useEffect(() => {
    if (predictions.length === treeCount) {
      const sunnyCount = predictions.filter(p => p === 'Sunny').length;
      setFinalPrediction(sunnyCount > treeCount / 2 ? 'Sunny' : 'Rainy');
    }
  }, [predictions, treeCount]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Random Forest Visualization</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Sample Data</h3>
        {features.map(feature => (
          <div key={feature} className="mb-2">
            <label className="mr-2">{feature}:</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={sampleData[feature]} 
              onChange={(e) => updateFeature(feature, e.target.value)}
              className="mr-2"
            />
            <span>{sampleData[feature]}</span>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Decision Trees in Forest</h3>
        <div className="flex flex-wrap justify-center">
          {forest.map((tree, i) => (
            <div key={i} className="m-2">
              <h4 className="text-center">Tree {i + 1}</h4>
              <DecisionTree 
                treeData={tree} 
                sampleData={sampleData} 
                onPredict={(prediction) => handlePredict(i, prediction)}
              />
              {predictions[i] && (
                <p className="text-center mt-2">Prediction: {predictions[i]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-center mb-4">
        <button 
          onClick={() => setTreeCount(prev => Math.min(prev + 1, 5))}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mr-2"
        >
          Add Tree
        </button>
        <button 
          onClick={() => setTreeCount(prev => Math.max(prev - 1, 1))}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Remove Tree
        </button>
      </div>

      {finalPrediction && (
        <div className="text-center">
          <h3 className="text-lg font-semibold">Final Prediction</h3>
          <p>The Random Forest predicts: {finalPrediction}</p>
          <p>({predictions.filter(p => p === 'Sunny').length} trees predict Sunny, {predictions.filter(p => p === 'Rainy').length} trees predict Rainy)</p>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">How it works</h3>
        <ol className="list-decimal list-inside">
          <li>Each decision tree is randomly generated with different feature thresholds.</li>
          <li>The sample data is run through each tree, following the path based on feature comparisons.</li>
          <li>Each tree makes an individual prediction (Sunny or Rainy).</li>
          <li>The final prediction is determined by majority vote among all trees.</li>
          <li>You can adjust the sample data and see how it affects the predictions in real-time.</li>
          <li>Try adding or removing trees to see how it impacts the forest's overall prediction!</li>
        </ol>
      </div>
    </div>
  );
};

export default RandomForestVisualization;