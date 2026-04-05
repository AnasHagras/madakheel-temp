import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Button,
  Card,
  Col,
  Form,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { toast } from "react-toastify";
// images
import * as XLSX from 'xlsx';
import trash from "../../../../public/assets/img/trash.png";
import checkUserType from "../../../../utils/checkUserType";
import { useRouter } from "next/router";

const DeletePopup = ({ setDeletePopup, userData, loading, deleteRow }) => {
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.6)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Body className='text-center'>
          <h4>هل انت متاكد من حذف المنتج : {userData?.name}</h4>
          <img src={trash.src} alt='trash' width={80} className='my-4' />
          <div className='d-flex justify-content-center gap-5'>
            <button
              className='btn btn-lg btn-danger px-5 '
              onClick={() => deleteRow(userData?.id)}
              disabled={loading}
              style={{ minWidth: "fit-content" }}
            >
              {loading ? "جاري الحذف ..." : "حذف"}
            </button>
            <button
              className='btn btn-lg btn-outline-dark px-5'
              onClick={() => setDeletePopup(false)}
            >
              إلغاء
            </button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

import { getUserCookies } from "../../../../utils/getUserCookies";

const user = getUserCookies();

const Orders = () => {

  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletePopup, setDeletePopup] = useState(false);
  const [suspendPopup, setSuspendPopup] = useState(false);
  const [activatePopup, setActivatePopup] = useState(false);
  const [addProductPopup, setAddProductPopup] = useState(false);

  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const router = useRouter();
  const { id_, type } = router.query;
  const { token, id, user_type } = user;
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  useEffect(() => {
    fetch(`http://167.99.143.80/ar/api/v1/products/product/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setData(data.results));
  }, [search, update]);

  const deleteRow = async (id) => {
    setLoading(true);
    const res = await fetch(`http://167.99.143.80/ar/api/v1/products/product/${id}/`, {
      method: "DELETE",
      headers: {
        // "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    });

 
    console.log(res );
    if (res.ok) {
      toast.success("تم الحذف بنجاح");
      forceUpdate();
      setDeletePopup(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
    }

    setLoading(false);
  
  };
  const addProduct = async (e, data) => {
    e.preventDefault();
    setLoading(true);

    const { price, title, desc, unitId, categoryId, files } = data;

    const fd = new FormData();
    fd.append("price", price);
    fd.append("name", title);
    fd.append("description", desc);
    fd.append("unit", unitId);
    fd.append("category", categoryId);
   
 
    files?.length > 0 && fd.append("images", files[0]);

    const res = await fetch("http://167.99.143.80/ar/api/v1/products/product/", {
      method: "POST",
      body: fd,
      headers: {
        Authorization: `Token ${token}`,
      },
    });

    const result = await res.json();

    if (res.ok  ) {
      toast.success("تم الإضافة بنجاح");
      forceUpdate();
      setAddProductPopup(false);
    } else {
      toast.error(result.message || "حدث خطأ ما");
    }

    setLoading(false);
    e.target.reset();
  };

  const columns = [
    {
      name: "المعرف",
      selector: (row) => [+row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "الاسم",
      selector: (row) => [row.name],
      cell: (row) => (
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/products/${row.id}`}
        >
          {row.name}
        </Link>
      ),
      sortable: true,
      filter: true,
      filterText: 'اسم المنتج',
    },
    {
      name: "السعر",
      selector: (row) => [row.price],
      sortable: true,
      filter: true,
      filterText: 'السعر',
      cell: (row) => (
        <div className='font-weight-bold'>{row.price}</div>
      ),
    },
    {
      name: "التصنيف",
      selector: (row) => [row.category],
      sortable: true,
      cell: (row) => <div>{row.category.name_ar}</div>,
    },
    {
      name: " الوحدة",
      selector: (row) => [row.unit],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>{row.unit.name_ar}</span>
        </div>
      ),

      sortable: true,
    },
    {
      name: " المهتمين بالشراء",
      selector: (row) => [row.owner],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>5</span>
        </div>
      ),

     
    },

    {
      name: "تاريخ اللإنشاء",
      selector: (row) => [row.datetime],
      cell: (row) => (
        <div className='d-flex my-auto'>
          <span className='my-auto'>
            {new Date(row.created_at).toLocaleDateString()}
          </span>
        </div>
      ),

      sortable: true,
    },
    // {
    //   name: "المحادثة",
    //   selector: (row) => [row.ACTIONS],
    //   cell: (row) => (
    //     <div
    //       className='button-list '
    //       onClick={() => {
    //         router.push('/dashboard/pages/products/chat/1')
    //       }}
    //     >
    //       <OverlayTrigger
    //         placement={row.Placement}
    //         overlay={<Tooltip> عرض</Tooltip>}
    //       >
    //         <i className='ti ti-comment btn'></i>
    //       </OverlayTrigger>
    //     </div>
    //   ),
    // },
    {
      name: "حذف",
      selector: (row) => [row.ACTIONS],
      cell: (row) => (
        <div
          className='button-list '
          onClick={() => {
            setDeletePopup(true);
            setUserData(row);
          }}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip> حذف</Tooltip>}
          >
            <i className='ti ti-trash btn'></i>
          </OverlayTrigger>
        </div>
      ),
    },
  ];

  const tableData = {
    columns,
    data,
    filter: true,
    filterPlaceholder:'بحث بالاسم او السعر او المدينة او القسم'
    
  };

  const isAdmin = checkUserType();



  return (
    <>
      <Seo title='عروض البيع' />

      <PageHeader title='عروض البيع' item='شركة وحيد' active_item='عروض البيع' />

      <div>

        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-10'>
                <div style={{ marginBottom: "-5px" }}>
                  <div className='d-flex justify-content-between '>
                    <label className='main-content-label my-auto'>
                      عروض البيع
                    </label>
                    <Button onClick={exportToExcel}>Export to Excel</Button>
                    {isAdmin === true ? (

                      // <Button
                      //   onClick={() =>
                      //     setAddProductPopup(true)
                      //   }
                      // >
                      //   إضافة  عرض بيع
                      // </Button>
                      ''
                    ) : (
                      <div className='py-3'></div>
                    )}


                  </div>
               
                </div>
              </Card.Header>
              <Card.Body>
                <DataTableExtensions {...tableData}>
                  <DataTable
                    columns={columns}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                    paginationPerPage={200}
                    paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                    filter={false}
                    filterPlaceholder={'بحث بالاسم او السعر او المدينة او القسم'}
                  />
                </DataTableExtensions>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
      </div>

      {deletePopup && (
        <DeletePopup
          loading={loading}
          setDeletePopup={setDeletePopup}
          userData={userData}
          deleteRow={deleteRow}
        />
      )}

      {addProductPopup && (
        <AddProductPopup
          loading={loading}
          setAddProductPopup={setAddProductPopup}
          addProduct={addProduct}
          token={token}
        />
      )}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const AddProductPopup = ({ setAddProductPopup, addProduct, loading ,token}) => {
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [units, setUnits] = useState([]);
  const [price, setPrice] = useState(null);
  const [categoryId, setCategoryId] = useState(0);
  const [unitId, setUnitId] = useState(0);
  const [files, setFiles] = useState(null);
  const [title, setTitle] = useState(null);
  const [desc, setDesc] = useState(null);
  useEffect(() => {
    fetch(`http://167.99.143.80/ar/api/v1/products/category/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setCategories(data));

      fetch(`http://167.99.143.80/ar/api/v1/products/unit/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUnits(data));
      fetch(`http://167.99.143.80/ar/api/v1/dashboard/city/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setCities(data));
  }, []);
  return (
    <div
    style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
    className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-75 d-flex justify-content-center align-items-center pt-5 pb-5'
  >
    <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px",height:'80vh' , overflow:"auto" }}>
        <Card.Header>
          <h3> عرض بيع</h3>
        </Card.Header>
        <Card.Body>
          
          <Form
            onSubmit={(e) =>
              addProduct(e, {
                price,
                unitId,
                categoryId,
                files,
                title,
                desc,
              })
            }
          >
             <label for="" className="fw-bold mt-2 mb-2 text-primary fs-4"> تفاصيل الطلب  </label>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>الاسم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الاسم'
                name='title'
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
       


            <Form.Group className='text-start form-group' controlId='formPackage'>
              <Form.Label>اختر المدينة</Form.Label>
              <Form.Select
                className='form-control ps-5 text-muted'
                name='categories'
                value={categoryId} // Assuming you have state for the selected package
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {/* Placeholder option */}
                <option value="">اختر المدينة...</option>
              {
                cities.map((category) => (
                  <option key={category.id} value={category.id}>{category.name_ar}</option>
                ))
              }
                
              </Form.Select>
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formPackage'>
              <Form.Label>اختر القسم</Form.Label>
              <Form.Select
                className='form-control ps-5 text-muted'
                name='categories'
                value={categoryId} // Assuming you have state for the selected package
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {/* Placeholder option */}
                <option value="">اختر القسم...</option>
              {
                categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name_ar}</option>
                ))
              }
                
              </Form.Select>
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>مكان التسليم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل مكان التسليم'
                name='title'
                type='text'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>وقت التسليم</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل وقت التسليم'
                name='title'
                type='date'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </Form.Group>
            <label for="" className="fw-bold mt-2 mb-2 text-primary fs-4"> خصائص السلعة </label>
            <Form.Group className='text-start form-group' controlId='formPackage'>
              <Form.Label>اختر الوحدة</Form.Label>
              <Form.Select
                className='form-control ps-5 text-muted'
                name='units'
                value={unitId} // Assuming you have state for the selected package
                onChange={(e) => setUnitId(e.target.value)}
                required
              >
                {/* Placeholder option */}
                <option value="">اختر الوحدة...</option>

               {
                units.map((unit) => (
                  <option key={unit.id} value={unit.id}>{unit.name_ar}</option>
                ))
               }
              </Form.Select>
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>الوزن  </Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الوزن   '
                name='price'
                type='number'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>الكمية  </Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل الكمية   '
                name='price'
                type='number'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>السعر الحالي  </Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل السعر الحالي   '
                name='price'
                type='number'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group' controlId='formEmail'>
              <Form.Label>السعر وقت البيع  </Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل السعر وقت البيع   '
                name='price'
                type='number'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label> إرفاق صورة المنتج </Form.Label>
              <Form.Control
                className='form-control'
                name='files'
                type='file'
                multiple
                onChange={(e) => setFiles(e.target.files)}
              />
            </Form.Group>
            <label for="" className="fw-bold mt-2 mb-2 text-primary fs-4"> تفاصيل السلعة </label>
            <Form.Group
              className='text-start form-group'
              controlId='formpassword'
            >
              <Form.Label>التفاصيل الخاصة</Form.Label>
              <textarea
                className='form-control'
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={5}
                placeholder='ادخل التفاصيل'
              />
            </Form.Group>
            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading ? "جار الإضافة..." : "إضافة  عرض البيع"}
              </Button>
              <Button
                onClick={() => setAddProductPopup(false)}
                type='button'
                className='btn ripple btn-main-primary btn-block mt-2 '
              >
                الغاء
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};