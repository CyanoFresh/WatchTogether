import React, { Component } from 'react';

class FilmSelect extends Component {
  render() {
    const { onChange, onReload, films, film: currentFilm } = this.props;

    return (
      <div className="FilmSelect">
        <select onChange={onChange} value={currentFilm ? currentFilm.id : ''} className="FilmSelect-select">
          <option>-- Choose Film --</option>
          {films.map(film =>
            <option key={film.id} value={film.id}>{film.name}</option>,
          )}
        </select>

        <button onClick={onReload}>Reload</button>
      </div>
    );
  }
}

export default FilmSelect;