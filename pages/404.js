import React from "react";
import Seo from "../shared/layout-components/seo/seo";
import Link from "next/link";

const Custom404 = () => {
  return (
    <div>
      {/* <!-- Page --> */}
      <Seo title='Error' />

      <div className='page main-signin-wrapper bg-primary construction'>
        <div className='d-flex header-setting-icon demo-icon fa-spin'>
          <a className='nav-link icon' href='javascript:void(0)'>
            <i className='fe fe-settings settings-icon '></i>
          </a>
        </div>

        <div className='container '>
          <div className='construction1 text-center details text-white'>
            <div className=''>
              <div className='col-lg-12'>
                <h1 className='tx-140 mb-0'>404</h1>
              </div>
              <div className='col-lg-12 '>
                <h1 className='mb-4'>عذراً، لم يتم العثور على الصفحة</h1>

                <Link
                  className='btn ripple btn-success text-center mb-2'
                  href='/dashboard/pages/dashboard/'
                >
                  الصفحة الرئيسية
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* <!-- End Page --> */}
    </div>
  );
};

export default Custom404;
