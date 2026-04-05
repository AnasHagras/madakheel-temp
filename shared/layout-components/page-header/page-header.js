import React from "react";

const PageHeader = (props) => {
  return (
    <div className='page-header' suppressHydrationWarning={true}>
      <div>
        <h2 className='main-content-title tx-24 mg-b-5'>{props.title}</h2>
        <ol className='breadcrumb'>
          <li className='breadcrumb-item'>
            <a>{props.item}</a>
          </li>
          <li className='breadcrumb-item active' aria-current='page'>
            {props.active_item}
          </li>
        </ol>
      </div>
    </div>
  );
};

export default PageHeader;
