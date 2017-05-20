import React from 'react';
import { LinkContainer } from 'react-router-bootstrap';
import { Navbar, Nav, MenuItem, NavDropdown } from 'react-bootstrap';

const NavBar = ({ user }) => {
    return (
        <Navbar fixedTop={true} fluid={true}>
            <Navbar.Header>
                <Navbar.Brand>
                    <LinkContainer to={'/'}>
                        <a href="/">Playlistr</a>
                    </LinkContainer>
                </Navbar.Brand>
            </Navbar.Header>
            {user
                ? <Navbar.Collapse>
                      <Nav pullRight>
                          <NavDropdown
                              title={user.username}
                              id="basic-nav-dropdown"
                          >
                              {/*<li role="presentation">*/}
                              <LinkContainer
                                  to={`/profile/${user.username}`}
                                  role="menuitem"
                              >
                                  <MenuItem>Profile</MenuItem>
                              </LinkContainer>
                              {/*</li>*/}
                              <MenuItem divider />
                              <MenuItem href="/logout">Sign Out</MenuItem>
                          </NavDropdown>
                      </Nav>
                  </Navbar.Collapse>
                : null}
        </Navbar>
    );
};

export default NavBar;
