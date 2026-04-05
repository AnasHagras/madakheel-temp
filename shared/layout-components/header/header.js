import React, { Fragment, useState } from "react";
import { Container, Navbar } from "react-bootstrap";
import Link from "next/link";

//Images
import logo from "../../../public/assets/img/brand/oboorlogo-dark.svg";
import logolight from "../../../public/assets/img/brand/oboorlogo-white.svg";

import dynamic from "next/dynamic";
const HeadDropDown = dynamic(() => import("../../data/header/head"), {
  ssr: false,
});

function Header() {
  //  headerToggleButton

  const headerToggleButton = () => {
    let body = document.querySelector("body");
    let innerWidth = window.innerWidth;
    if (body !== !body) {
      if (innerWidth >= 992) {
        document.querySelector("body")?.classList.toggle("main-sidebar-hide");
        document.querySelector("body")?.classList.remove("main-sidebar-show");
      } else if (document.body.classList.contains("horizontalmenu")) {
        document.querySelector("body")?.classList.toggle("main-navbar-show");
        document.querySelector("body")?.classList.remove("main-sidebar-show");
        document.querySelector("body")?.classList.remove("main-sidebar-hide");
      } else {
        document.querySelector("body")?.classList.toggle("main-sidebar-show");
        document.querySelector("body")?.classList.remove("main-sidebar-hide");
      }
    }
  };

  return (
    <Fragment>
      <Navbar
        expand='lg'
        className='main-header side-header sticky'
        // style={{ marginBottom: "-64px" }}
      >
        <Container fluid className='main-container container-fluid'>
          <div className='main-header-left'>
            <a
              className='main-header-menu-icon'
              id='mainSidebarToggle'
              onClick={() => headerToggleButton()}
            >
              <span></span>
            </a>
          </div>
          <div className='main-header-center'>
            <div className='responsive-logo'>
              <Link href='/dashboard/pages/dashboard'>
                <img
                  src={logo.src}
                  className='mobile-logo'
                  alt='logo'
                  width={50}
                  style={{ transform: "scale(1.5)" }}
                />
              </Link>
              <Link href='/dashboard/pages/dashboard'>
                <img
                  src={logolight.src}
                  className='mobile-logo-dark'
                  alt='logo'
                  width={50}
                  style={{ transform: "scale(1.5)" }}
                />
              </Link>
            </div>
            {/* <InputGroup>
              <Selectoptions />
              <Form.Control
                type='search'
                className='rounded-0 min-w-300'
                style={{ minWidth: "200px" }}
                value={InputValue}
                onChange={(ele) => {
                  myfunction(ele.target.value);
                  setInputValue(ele.target.value);
                }}
                placeholder='البحث في البيانات'
              />
              <InputGroup.Text className='btn search-btn'>
                <i className='fe fe-search'></i>
              </InputGroup.Text>
            </InputGroup> */}
            {/* {show1 ? (
              <div className='card search-result p-absolute w-40  border mt-1'>
                <div className='card-header'>
                  <h4 className='card-title me-2 text-break'>
                    Search result of {InputValue}
                  </h4>
                </div>
                <ul className='mt-2'>
                  {show2 ? (
                    NavData.map((e) => (
                      <li key={Math.random()} className=''>
                        <Link
                          href={`${e.path}/`}
                          className='search-result-item'
                          onClick={() => {
                            setShow1(false), setInputValue("");
                          }}
                        >
                          {e.title}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <b className={`${searchcolor} `}>{searchval}</b>
                  )}
                </ul>
              </div>
            ) : (
              ""
            )} */}
          </div>
          <div className='main-header-right'>
            <Navbar.Toggle
              aria-controls='navbarSupportedContent-4'
              className='navresponsive-toggler'
            >
              <i className='fe fe-more-vertical header-icons navbar-toggler-icon'></i>
            </Navbar.Toggle>
            <div className='navbar navbar-expand-lg nav nav-item navbar-nav-right responsive-navbar navbar-dark'>
              <Navbar.Collapse
                className='collapse navbar-collapse'
                id='navbarSupportedContent-4'
              >
                <HeadDropDown />
              </Navbar.Collapse>
            </div>
          </div>
        </Container>
      </Navbar>
    </Fragment>
  );
}

Header.propTypes = {};

Header.defaultProps = {};

export default Header;
