import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import KCafe from './components/KCafe'; // 注意路徑如果有改資料夾

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KCafe />} />
        <Route path="/guest" element={<KCafe hideMenu={true} />} />
      </Routes>
    </Router>
  );
}

export default App;
