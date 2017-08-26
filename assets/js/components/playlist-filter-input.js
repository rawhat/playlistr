import React from 'react';
import { connect } from 'react-redux';

import {
    doChangePlaylistFilter,
    getPlaylistCategories,
} from '../ducks/playlist';

const PlaylistFilterInput = ({ categories, changeFilter }) =>
    <select className='form-control' onChange={(e) => changeFilter(e.target.value)}>
        {[<option key='All'>All</option>].concat(categories.map((category, index) =>
            <option key={`${category}-${index}`}>{category}</option>
        ))}
    </select>

const mapStateToProps = (state) => ({
    categories: getPlaylistCategories(state)
})

export default connect(mapStateToProps,
    { changeFilter: doChangePlaylistFilter })(PlaylistFilterInput);
