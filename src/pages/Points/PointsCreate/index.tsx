import React, { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet'
import { LeafletMouseEvent } from 'leaflet'

import axios from 'axios';
import server from '../../../services/server';

import Dropzone from '../../../components/Dropzone';

import './styles.css';

import logo from '../../../assets/logo.svg';

interface State {
  initials: string;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface Category {
  id: number,
  name: string,
  image_url: string
}

interface IbgeResponseState {
  sigla: string;
  nome: string;
}

interface IbgeResponseCity {
  id: number;
  nome: string;
}

function PointsCreate() {
  const [selectedFile, setSelectedFile] = useState<File>();

  const [initialMapPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
  const [selectedMapPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);

  const [states, setStates] = useState<State[]>([]);
  const [selectedState, setSelectedState] = useState('');

  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    summary: '',
    email: '',
    phone: ''
  });

  const history = useHistory();

  /**
   * Get and set map initial position from user location.
   */
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;

      setInitialPosition([latitude, longitude]);
    });
  }, []);

  /**
   * Fetch and set categories.
   */
  useEffect(() => {
    server.get('categories').then(response => {
      setCategories(response.data);
    });
  }, []);

  /**
   * Fetch and set states.
   */
  useEffect(() => {
    axios.get<IbgeResponseState[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(response => {
      const states = response.data.map(state => {
        return {
          initials: state.sigla,
          name: state.nome,
        };
      });

      setStates(states);
    });
  }, []);

  /**
   * Fetch and set cities.
   */
  useEffect(() => {
    if (selectedState === undefined) {
      return;
    }

    axios
      .get<IbgeResponseCity[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedState}/municipios?orderBy=nome`)
      .then(response => {
        const cities = response.data.map(city => {
          return {
            id: city.id,
            name: city.nome,
          };
        });

        setCities(cities);
    });
  }, [selectedState]);

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([
      event.latlng.lat,
      event.latlng.lng,
    ]);
  }

  function handleStateSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedState(event.target.value);
  }

  function handleCitySelectChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedCity(event.target.value);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData({
      ...formData, [name]: value,
    });
  }

  function handleCategoryCheck(id: number) {
    const alreadySelected = selectedCategories.findIndex(category => category === id);

    let categories = [];

    if (alreadySelected >= 0) {
      categories = selectedCategories.filter(category => category !== id);
    } else {
      categories = [
        ...selectedCategories, id,
      ];
    }

    setSelectedCategories(categories);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { summary, email, phone } = formData;
    const state = selectedState;
    const city = selectedCity;
    const [latitude, longitude] = selectedMapPosition;
    const categories = selectedCategories;

    const data = new FormData();

    data.append('summary', summary);
    data.append('email', email);
    data.append('phone', phone);
    data.append('latitude', String(latitude));
    data.append('longitude', String(longitude));
    data.append('state', state);
    data.append('city', city);
    data.append('categories', categories.join(','));

    if (selectedFile) {
      data.append('image', selectedFile);
    }

    await server.post('points', data);

    alert('Ponto de coleta criado com sucesso!');

    history.push('/');
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Logo do Ecoleta"/>

        <Link to="/">
          <span><FiArrowLeft /></span>
          <span>Voltar para a home</span>
        </Link>
      </header>

      <form action="" onSubmit={handleSubmit}>
        <h1>Cadastro do ponto de coleta</h1>

        <Dropzone onFileUploaded={setSelectedFile} />

        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="summary">Estabelecimento</label>
            <input 
              type="text"
              name="summary"
              id="summary"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="name">E-mail</label>
              <input 
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>

            <div className="field">
              <label htmlFor="name">Celular</label>
              <input 
                type="text"
                name="phone"
                id="phone"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialMapPosition} zoom={15} onClick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={selectedMapPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="state">Estado</label>
              <select
                name="state"
                id="state"
                value={selectedState}
                onChange={handleStateSelectChange}
              >
                <option value="">Selectione o estado</option>
                {states.map(state => (
                  <option key={state.initials} value={state.initials}>{state.name}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select
                name="city"
                id="city"
                onChange={handleCitySelectChange}
              >
                <option value="">Selectione a cidade</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Categorias de coleta</h2>
            <span>Selecione um ou mais ítens abaixo</span>
          </legend>

          <ul className="items-grid">
            {categories.map(category => (
              <li
                key={category.id}
                onClick={() => handleCategoryCheck(category.id)}
                className={selectedCategories.includes(category.id) ? 'selected' : ''}
              >
                <img src={category.image_url} alt={category.name} />
                <span>{category.name}</span>
              </li>
            ))}
          </ul>
        </fieldset>

        <button type="submit">
          Cadastrar
        </button>
      </form>
    </div>
  );
}

export default PointsCreate;
