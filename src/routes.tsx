import React, { Component } from 'react';
import { Route, BrowserRouter } from 'react-router-dom';

import Home from './pages/Home';
import PointsCreate from './pages/Points/PointsCreate';

class Routes extends Component {
  render () {
    return (
      <BrowserRouter>
        <Route component={Home} path="/" exact />
        <Route component={PointsCreate} path="/points/create" />
      </BrowserRouter>
    );
  }
}

export default Routes;
