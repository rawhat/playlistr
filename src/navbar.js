import React from 'react';
import { Link } from 'react-router-dom';
import {
    Navbar,
    Nav,
    MenuItem,
    NavDropdown
} from 'react-bootstrap';

const NavBar = ({ user }) => {
    return (
        <Navbar fixedTop={true} fluid={true}>
            <Navbar.Header>
                <Navbar.Brand>
                    <Link to={'/'}>Playlistr</Link>
                </Navbar.Brand>
            </Navbar.Header>
            {user ?
            <Navbar.Collapse>
                <Nav pullRight>
                    <NavDropdown title={user.username} id='basic-nav-dropdown'>
                        <li role="presentation">
                            <Link to={`/profile/${user.username}`} role="menuitem">Profile</Link>
                        </li>
                        <MenuItem divider />
                        <MenuItem href='/logout'>Sign Out</MenuItem>
                    </NavDropdown>
                </Nav>
            </Navbar.Collapse> : null}
        </Navbar>
    );
};

export default NavBar;