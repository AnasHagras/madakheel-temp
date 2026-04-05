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
          <h4>هل انت متاكد من حذف المدينة : {userData?.name_ar}</h4>
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
  const [isAddNew, setIsAddNew] = useState(true);
  const [update, forceUpdate] = useReducer((x) => x + 1, 0);
  const router = useRouter();

  const { token, id, user_type } = user;
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table.xlsx");
  };
  useEffect(() => {
    fetch(`http://192.34.59.161/api/v1/dashboard/cities/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: ` ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) =>  setData(data));
     console.log(data);
  }, [search, update]);

  const deleteRow = async (id) => {
    setLoading(true);
    const res = await fetch(`http://192.34.59.161/api/v1/dashboard/cities/${id}/`, {
      method: "DELETE",
      headers: {
        // "Content-Type": "application/json",
        Authorization: ` ${token}`,
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

    const {  title, categoryId } = data;

    const fd = new FormData();
    fd.append("name_ar", title);
    fd.append("name_en", title);
    fd.append("country", categoryId);
   

    const res = await fetch(`http://192.34.59.161/api/v1/dashboard/cities/${!isAddNew ? userData.id +'/' : ""}`, {
      method:  isAddNew ? "POST" : "PATCH",
      body: fd,
      headers: {
        Authorization: ` ${token}`,
      },
    });

    const result = await res.json();

    if (res.ok  ) {
      toast.success(result.message || "تم الإضافة بنجاح");
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
      selector: (row) => [row.name_ar],
      cell: (row) => (
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/products/`}
        >
          {row.name_ar}
        </Link>
      ),
      sortable: true,
    },
   
    {
      name: "الدولة",
      selector: (row) => [row.country],
      sortable: true,
      cell: (row) => <div>{row.country.name_ar}</div>,
    },
    {
      name: "إجمالي عدد الطلبات",
      selector: (row) => [row.country],
      sortable: true,
      cell: (row) => <div>20</div>,
    },
    {
      name: "كل الطلبات",
      selector: (row) => [row.ACTIONS],
      cell: (row) => (
        <div
          className='button-list '
          onClick={() => {
            router.push("/dashboard/pages/cities/1");
         
          }}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip> عرض</Tooltip>}
          >
            <i className='ti ti-eye btn'></i>
          </OverlayTrigger>
        </div>
      ),
    },
   
  

   
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
    {
      name: "تعديل",
      selector: (row) => [row.ACTIONS],
      cell: (row) => (
        <div
          className='button-list '
          onClick={() => {
            setIsAddNew(false)
            setAddProductPopup(true);
            setUserData(row);
          }}
        >
          <OverlayTrigger
            placement={row.Placement}
            overlay={<Tooltip> تعديل</Tooltip>}
          >
            <i className='ti ti-pencil btn'></i>
          </OverlayTrigger>
        </div>
      ),
    },
  ];

  const tableData = {
    columns,
    data,
  };

  const isAdmin = checkUserType();



  return (
    <>
      <Seo title='المدن' />

      <PageHeader title='المدن' item='شركة وحيد' active_item='المدن' />

      <div>

        {/* <!-- Row --> */}
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 pb-10'>
                <div style={{ marginBottom: "-5px" }}>
                  <div className='d-flex justify-content-between '>
                    <label className='main-content-label my-auto'>
                      المدن
                    </label>
                    <Button onClick={exportToExcel}>Export to Excel</Button>
                    {isAdmin === true ? (

                      <Button
                        onClick={() =>{
                          setIsAddNew(true)
                          setAddProductPopup(true)
                        }
                        }
                      >
                        إضافة مدينة جديد
                      </Button>
                    ) : (
                      <div className='py-3'></div>
                    )}


                  </div>
                  <input
                    type='text'
                    className='search-input'
                    placeholder='بحث'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
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
          userData={userData}
          isAddNew={isAddNew}
        />
      )}
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;

const AddProductPopup = ({ setAddProductPopup, addProduct, loading ,token ,userData ,isAddNew}) => {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(!isAddNew ? userData.country.id :0);
  const [title, setTitle] = useState(!isAddNew ? userData.name_ar :null);

  useEffect(() => {
    fetch(`http://192.34.59.161/api/v1/dashboard/countries/`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: ` ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setCategories(data));

  }, []);
  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-absolute top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Header>
         {isAddNew ? <h3>مدينة جديدة</h3> : <h3>تعديل المدينة </h3> } 

          
        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) =>
              addProduct(e, {
              
                categoryId,
             
                title,
             
              })
            }
          >
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
              <Form.Label>اختر الدولة</Form.Label>
              <Form.Select
                className='form-control ps-5 text-muted'
                name='categories'
                value={categoryId} // Assuming you have state for the selected package
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {/* Placeholder option */}
                <option value="">اختر الدولة...</option>
              {
                categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name_ar}</option>
                ))
              }
                
              </Form.Select>
            </Form.Group>
           

           
          
            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading ? "جار الإضافة..." :  isAddNew ? "إضافة مدينة جديدة" : "تعديل"}
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
