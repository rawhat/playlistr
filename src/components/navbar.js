import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { LinkContainer } from 'react-router-bootstrap';
import { Navbar, Nav, MenuItem, NavDropdown } from 'react-bootstrap';

class NavBar extends Component {
    static propTypes = {
        user: PropTypes.object,
    };

    render = () => {
        return (
            <Navbar fixedTop={true} fluid={true}>
                <Navbar.Header>
                    <Navbar.Brand>
                        <LinkContainer to={'/'}>
                            <a href="/">Playlistr</a>
                        </LinkContainer>
                    </Navbar.Brand>
                </Navbar.Header>
                {this.props.user
                    ? <Navbar.Collapse>
                          <Nav pullRight>
                              <NavDropdown
                                  title={this.props.user.username}
                                  id="basic-nav-dropdown"
                              >
                                  {/*<li role="presentation">*/}
                                  <LinkContainer
                                      to={`/profile/${this.props.user.username}`}
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
}

const mapStateToProps = state => {
    return {
        user: state.auth.user,
    };
};

export default connect(mapStateToProps)(NavBar);
