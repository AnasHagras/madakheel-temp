import React, { useEffect, useReducer, useState } from "react";
import dynamic from "next/dynamic";
import PageHeader from "../../../../shared/layout-components/page-header/page-header";
import {
  Accordion,
  Button,
  Card,
  Col,
  Form,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
// import DataTable from "react-data-table-component";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
// import DataTableExtensions from "react-data-table-component-extensions";
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import "react-data-table-component-extensions/dist/index.css";
import Seo from "../../../../shared/layout-components/seo/seo";
import Link from "next/link";
import { toast } from "react-toastify";
// images
import stop from "../../../../public/assets/img/stop.png";
import trash from "../../../../public/assets/img/trash.png";
import active from "../../../../public/assets/img/active.png";
import { useRouter } from "next/router";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main styles
import "react-date-range/dist/theme/default.css"; // Theme styles




import { getUserCookies } from "../../../../utils/getUserCookies";
import logout from "../../../../utils/logout";

const user = getUserCookies();

const Orders = () => {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [payoutData, setPayoutData] = useState([]);
  const [employee, setEmployee] = useState({});
  const [payOutPopup, setPayOutPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toLocaleDateString("en-CA"));
  const [end, setEnd] = useState(new Date().toLocaleDateString("en-CA"));
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Default: Last 30 days
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const { token, user_type } = user;
  const router = useRouter();
  const { id } = router.query;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isFilterModified, setIsFilterModified] = useState(false);
  const handleApply = () => {
    const start = dateRange[0].startDate.toLocaleDateString("en-CA"); // صيغة YYYY-MM-DD
    const end = dateRange[0].endDate.toLocaleDateString("en-CA"); // صيغة YYYY-MM-DD
    setStart(start)
    setEnd(end)
    setShowDatePicker(false);
    setIsFilterModified(true);
  };
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(20); // Set default rows per page
  const [currentPage, setCurrentPage] = useState(1);
  const handlePerRowsChange = newPerPage => {
    console.log('newPerPage', newPerPage);

    setPerPage(newPerPage);
    setCurrentPage(1);
  };
  const handlePageChange = page => {
    setCurrentPage(page);
  };
  const resetFilter = () => {
    const defaultStartDate = new Date(new Date().setDate(new Date().getDate() - 30));
    const defaultEndDate = new Date();
    
    setDateRange([
      {
        startDate: defaultStartDate,
        endDate: defaultEndDate,
        key: "selection",
      },
    ]);
    
    // Set start and end to match dateRange values in YYYY-MM-DD format
    setStart(defaultStartDate.toISOString().split('T')[0]);
    setEnd(defaultEndDate.toISOString().split('T')[0]);
    // Reset your filtered data here
    setIsFilterModified(false);
  };
  const handleCancel = () => {
    setShowDatePicker(false);
  };
  const handleRecentDateSelection = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case "today":
        startDate = today;
        endDate = today;
        break;
      case "yesterday":
        startDate = new Date(today.setDate(today.getDate() - 1));
        endDate = new Date(today.setDate(today.getDate()));
        break;
      case "lastWeek":
        startDate = new Date(today.setDate(today.getDate() - 7));
        endDate = new Date();
        break;
      case "last30Days":
        startDate = new Date(today.setDate(today.getDate() - 30));
        endDate = new Date();
        break;
      case "lastMonth":
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "last3Months":
        startDate = new Date(today.setMonth(today.getMonth() - 3));
        endDate = new Date();
        break;
      case "currentYear":
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date();
        break;
      case "lastYear":
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;

      default:
        startDate = new Date(new Date().setDate(new Date().getDate() - 30));
        endDate = new Date();
    }

    setDateRange([
      {
        startDate,
        endDate,
        key: "selection",
      },
    ]);
    setIsFilterModified(true);
  };
  useEffect(() => {
    id &&
      fetch(`${baseUrl}/api/v1/list_sale_employee/${id}/?date_range_start=${start}&date_range_end=${end}`, {
        headers: {
          Authorization: ` ${user.token}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => setEmployee(data));
    id &&
      fetch(`${baseUrl}/api/v1/sale-employee-payout/?sale_admin=${id}`, {
        headers: {
          Authorization: ` ${user.token}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          return res.json();
        })
        .then((data) => setPayoutData(data));
    //* Get Sales Employee Record
    id &&
      fetch(`${baseUrl}/api/v1/admin/get_sale_employee_record/${id}/?admin_id=${user.id}`, {

        headers: {
          Authorization: ` ${user.token}`,
        },
      })
        .then((res) => {
          if (res.status === 401) {
            logout();
            return;
          }
          if (res.status === 403) {

            return;
          }
          return res.json();
        })
        .then((data) => {
          const users = [];
          const salesData = [];
          setTotalRows(data.count || 0);
          data?.results.forEach(item => {
            if (item.purchase == null) {
              users.push(item);
            } else {
              salesData.push(item);
            }
          });

          setUsers(users);
          setData(salesData);
        });
  }, [id, start, end]);

  console.log(users);

  const columns = [
    {
      name: "ID",
      selector: (row) => [row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "اسم العميل ",
      selector: (row) => [row?.user?.name],
      sortable: true,
      cell: (row) => (
        <Link
          href={`/dashboard/pages/users/${row?.user?.id}/`}
          className='font-weight-bold'
        >
          {row?.user?.name}
        </Link>
      ),
    },
    {
      name: "الباقة",
      selector: (row) => [row?.purchase?.Package?.title],
      cell: (row) => (
        <Link
          href={`/dashboard/pages/packages/${row?.purchase?.Package?.id}/`}
          className='font-weight-bold'
        >
          {row?.purchase?.Package?.title}
        </Link>
      ),
      sortable: true,
    },
    {
      name: "الكمية",
      selector: (row) => [row.national_id],
      sortable: true,
      cell: (row) => (
        <Link
          className='font-weight-bold'
          href={`/dashboard/pages/purchases/${row?.purchase?.id}/`}
        >
          {row?.purchase?.quantity}
        </Link>
      ),
    },
    {
      name: "الملاحظات",
      selector: (row) => [row.notes],
      sortable: true,
      cell: (row) => (
        <div
          className='font-weight-bold'

        >
          {row?.notes}
        </div>
      ),
    },
    {
      name: "الحالة",
      selector: (row) => [row.status],
      sortable: true,
      cell: (row) => (
        <div
          className='font-weight-bold'

        >
          {row?.status}

          {/* 

          {row?.status === "CANCELLED"
            ? "الغاء"
            : row?.status == null
              ? ""
              : 'تعديل'} */}

        </div>
      ),
    },
  ];
  const columnsUsers = [
    {
      name: "ID",
      selector: (row) => [row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: "اسم العميل ",
      selector: (row) => [row?.customer?.name],
      sortable: true,
      cell: (row) => (
        <Link
          href={`/dashboard/pages/users/${row?.customer?.id}/`}
          className='font-weight-bold'
        >
          {row?.customer?.name}
        </Link>
      ),
    },
    {
      name: "الجوال",
      selector: (row) => [row?.purchase?.Package?.title],
      cell: (row) => (
        <Link
          href={``}
          className='font-weight-bold'
        >
          {row?.customer?.mobile}
        </Link>
      ),
      sortable: true,
    },
    {
      name: "الملاحظات",
      selector: (row) => [row.notes],
      sortable: true,
      cell: (row) => (
        <div
          className='font-weight-bold'

        >
          {row?.notes}
        </div>
      ),
    },
    {
      name: "الحالة",
      selector: (row) => [row.status],
      sortable: true,
      cell: (row) => (
        <div
          className='font-weight-bold'

        >
          {/* {row?.status} */}



          {row?.status === "HANDLED"
            ? "تم التواصل"
            : row?.status == null
              ? ""
              : 'جديد'}

        </div>
      ),
    },
  ];

  const columnsPayout = [
    {
      name: "ID",
      selector: (row) => [row.id],
      sortable: true,
      cell: (row) => <div className='font-weight-bold'>{row.id}</div>,
    },

    {
      name: " المبلغ ",
      selector: (row) => [row?.customer?.name],
      sortable: true,
      cell: (row) => (
        <span

          className='font-weight-bold'
        >
          {row?.amount}
        </span>
      ),
    },
    {
      name: "التاريخ",
      selector: (row) => [row?.purchase?.Package?.title],
      cell: (row) => (
        <span

          className='font-weight-bold'
        >
          {/* {row?.pay_date} */}
          {new Date(row?.pay_date).toLocaleDateString()}
        </span>
      ),
      sortable: true,
    },

  ];

  const tableData = {
    columns,
    data,
  };
  const tableUserData = {
    columns: columnsUsers,
    data: users,
  };
  const tablePayoutData = {
    columns: columnsPayout,
    data: payoutData,
  };
  const changeNumberFormate = (number, type) => {
    const changedNumber = new Intl.NumberFormat().format(number);
    if (type === "float") {
      const splitedNumber = changedNumber.split(".");
      let newNumber;
      if (splitedNumber[1] > 0) {
        if (splitedNumber[1].length === 1) {
          newNumber = splitedNumber[0] + "." + splitedNumber[1] + "00";
        } else if (splitedNumber[1].length === 2) {
          newNumber = splitedNumber[0] + "." + splitedNumber[1] + "0";
        } else if (splitedNumber[1].length === 3) {
          newNumber = splitedNumber[0] + "." + splitedNumber[1];
        }
      } else {
        newNumber = splitedNumber[0] + ".00";
      }
      return newNumber;
    } else if (type === "int") {
      return changedNumber;
    }
  };
  return (
    <>
      <Seo title='عمليات الموظفين' />

      <PageHeader
        title='عمليات الموظفين'
        item='شركة وحيد'
        active_item={`عمليات الموظف : ${employee?.name}`}
      />

      <div>
        {/* <!-- Row --> */}
        <Row className="mb-3 d-flex justify-content-start gap-2">
          <Col className="w-fit d-flex gap-2" lg={3} md={6}>
            <Button
              variant="outline-primary"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              {dateRange[0].startDate.toLocaleDateString()} -{" "}
              {dateRange[0].endDate.toLocaleDateString()}
            </Button>
            {showDatePicker && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  zIndex: 1000,
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  gap: "16px",
                }}
              >


                {/* Right Side: Date Picker */}
                <div style={{ flex: 1 }}>
                  {/* Header with Start and End Dates */}
                  <div className="d-flex justify-content-between mb-3 gap-2">
                    <div>
                      <label>تاريخ البداية</label>
                      <input
                        type="text"
                        readOnly
                        value={dateRange[0].startDate.toLocaleDateString()}
                        className="form-control"
                      />
                    </div>
                    <div>
                      <label>تاريخ النهاية</label>
                      <input
                        type="text"
                        readOnly
                        value={dateRange[0].endDate.toLocaleDateString()}
                        className="form-control w-100"
                      />
                    </div>
                  </div>

                  {/* Date Picker */}
                  <DateRange
                    onChange={(ranges) => {
                      setDateRange([ranges.selection]);
                      setIsFilterModified(true);
                    }}
                    ranges={dateRange}
                    rangeColors={["#007bff"]}
                    showDateDisplay={false}
                    className="custom-date-range w-100"
                  />

                  {/* Buttons */}
                  <div className="d-flex justify-content-end mt-3 gap-2">
                    <Button variant="secondary" onClick={handleCancel}>
                      الغاء
                    </Button>
                    <Button variant="primary" onClick={handleApply}>
                      تطبيق
                    </Button>
                  </div>
                </div>
                {/* Left Side: Recent Date Options */}
                <div style={{ width: "130px" }}>
                  <h6>اختر فترة زمنية</h6>
                  <div className="d-flex flex-column gap-2">
                    <Button variant="outline-secondary" onClick={() => handleRecentDateSelection("today")}>
                      اليوم
                    </Button>
                    <Button variant="outline-secondary" onClick={() => handleRecentDateSelection("yesterday")}>
                      أمس
                    </Button>
                    <Button variant="outline-secondary" onClick={() => handleRecentDateSelection("lastWeek")}>
                      الأسبوع الماضي
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => handleRecentDateSelection("last30Days")}
                    >
                      آخر 30 يوم
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => handleRecentDateSelection("lastMonth")}
                    >
                      الشهر الماضي
                    </Button>
                    <Button variant="outline-secondary" onClick={() => handleRecentDateSelection("last3Months")}>
                      3 أشهر
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => handleRecentDateSelection("lastYear")}
                    >
                      آخر سنة
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => handleRecentDateSelection("currentYear")}
                    >
                      من بداية السنة الحالية
                    </Button>


                  </div>
                </div>
              </div>
            )}
            {isFilterModified && (
              <Button variant="danger" onClick={resetFilter}>
                إعادة تعيين
              </Button>
            )}
          </Col>
          <Col className="w-fit" lg={3} md={6}></Col>
        </Row>
        <Row className='row-sm '>
          <Col sm={12} md={6} lg={6} xl={3}>
            <Card className='custom-card'>
              <Card.Body>
                <div className='card-order '>
                  <label className='main-content-label mb-3 ' style={{ textAlign: "center", width: "100%" }}>

                    إجمالي عمليات الشراء لأول مرة عن طريق عرض
                  </label>
                  <h2 className='text-center card-item-icon card-icon'>
                    <i className='mdi mdi-cube icon-size  text-primary'></i>
                    <br /><br />
                    <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold mt-2'>
                      {console.log(';;;;;;;;;', employee?.statistics)
                      }
                      {changeNumberFormate(employee?.statistics?.total_user_paid_first_time_offer, "int")}
                    </span>
                  </h2>
                  {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>50%</span>
                </p> */}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col sm={12} md={6} lg={6} xl={3}>
            <Card className='custom-card'>
              <Card.Body>
                <div className='card-order '>
                  <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>

                    إجمالي عمليات الشراء المكررة عن طريق عرض
                  </label>
                  <h2 className='text-center card-item-icon card-icon'>
                    <i className='mdi mdi-cube icon-size  text-primary'></i>
                    <br /><br />
                    <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                      {console.log(';;;;;;;;;', employee?.statistics)
                      }
                      {changeNumberFormate(employee?.statistics?.total_user_paid_offer, "int")}
                    </span>
                  </h2>
                  {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>50%</span>
                </p> */}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col sm={12} md={6} lg={6} xl={3}>
            <Card className='custom-card'>
              <Card.Body>
                <div className='card-order '>
                  <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>

                    إجمالي قيمة الشراء لأول مرة عن طريق عملاء مسندون
                  </label>
                  <h2 className='text-center card-item-icon card-icon'>
                    <i className='mdi mdi-cube icon-size  text-primary'></i>
                    <br /><br />
                    <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                      {console.log(';;;;;;;;;', employee?.statistics)
                      }
                      {changeNumberFormate(employee?.statistics?.total_user_paid_first_time, "int")}
                    </span>
                  </h2>
                  {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>50%</span>
                </p> */}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col sm={12} md={6} lg={6} xl={3}>
            <Card className='custom-card'>
              <Card.Body>
                <div className='card-order '>
                  <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>

                    إجمالي قيمة الشراء المكررة عن طريق عملاء مسندون
                  </label>
                  <h2 className='text-center card-item-icon card-icon'>
                    <i className='mdi mdi-cube icon-size  text-primary'></i>
                    <br /><br />
                    <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                      {console.log(';;;;;;;;;', employee?.statistics)
                      }
                      {changeNumberFormate(employee?.statistics?.total_user_paid, "int")}
                    </span>
                  </h2>
                  {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>50%</span>
                </p> */}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col sm={12} md={6} lg={6} xl={3}>
            <Card className='custom-card'>
              <Card.Body>
                <div className='card-order '>
                  <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                    عدد العملاء المسندين
                  </label>
                  <h2 className='text-center card-item-icon card-icon'>
                    <i className='mdi mdi-account-multiple icon-size  text-primary'></i>
                    <br /><br />
                    <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                      {console.log(';;;;;;;;;', employee?.statistics)
                      }

                      {changeNumberFormate(employee?.statistics?.sale_employee_users_count, "int")}

                    </span>
                  </h2>
                  {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>50%</span>
                </p> */}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className='row-sm'>
          <Col md={12} lg={12}>
            <Card className=' custom-card'>
              <Card.Header className=' border-bottom-0 '>
                <div>
                  <div className='actions d-flex flex-wrap justify-content-end gap-2'>
                    {
                      user_type === "ADM" ?

                        <Button className='mx-3' onClick={() => setPayOutPopup(true)}>
                          سداد عمولة
                        </Button>
                        : ''
                    }






                  </div>
                  <div className='mb-4'>
                    <label className='main-content-label my-auto '>
                      {`عمليات الموظف : ${employee?.name}`}
                    </label>
                  </div>

                  <div className='d-flex justify-content-between flex-wrap gap-2'>
                    <h5 className='py-2 flex-1'>
                      البريد الالكتروني : {employee?.email}
                    </h5>
                    <h5 className='py-2 flex-1'>
                      رقم الجوال : {employee?.mobile}
                    </h5>
                    <h5 className='py-2 flex-1'>
                      رقم التواصل : {employee?.sale_admin_contact_number}
                    </h5>
                    <h5 className='py-2 flex-1'>
                      {" "}
                      الهوية : {employee?.national_id}
                    </h5>
                  </div>
                </div>
              </Card.Header>



              <Card.Body>
                <div className='mb-4'>
                  <label className='main-content-label my-auto'>
                    العملاء وعمليات الشراء
                  </label>
                </div>
                <div className='accordion-container'>
                  <Accordion defaultActiveKey="0">
                    {employee?.statistics?.assigned_users_with_purchases?.length > 0 ?
                      employee?.statistics?.assigned_users_with_purchases?.map((item, index) => (
                        <Accordion.Item eventKey={index.toString()} key={item.id}>
                          <Accordion.Header>
                            <h5 className="mb-0"> {item?.user?.id} </h5> - <h5 className="mb-0"> {item?.user?.name} </h5> - <h5 className="mb-0"> {item?.user?.mobile} </h5>-   <h5 className="mb-0">
                              {item?.purchases?.reduce((acc, purchase) => acc + (purchase?.total_price || 0), 0).toLocaleString()} ريال
                            </h5>
                          </Accordion.Header>
                          <Accordion.Body>
                            {item?.purchases?.length > 0 ? item?.purchases?.map((purchase) => (
                              <div
                                key={purchase?.id}
                                style={{
                                  padding: "10px 20px",
                                  // border: "1px solid #ddd",
                                  marginBottom: "8px",
                                  borderRadius: "8px",
                                  boxShadow: "1px 1px 4px 0 rgba(0, 0, 0, 0.2)",
                                }}
                              >
                                طلب رقم {purchase?.id} بإجمالي: {" "}
                                <strong>{purchase?.total_price?.toLocaleString()} ريال</strong>
                              </div>
                            )) : <div className="d-flex justify-content-center align-items-center p-4">لا يوجد طلبات شراء</div>}
                          </Accordion.Body>
                        </Accordion.Item>
                      ))
                      :
                      <div className="d-flex justify-content-center align-items-center p-5">لا يوجد طلبات</div>
                    }
                  </Accordion>
                </div>
              </Card.Body>



              <Card.Body>
                <div className='mb-4'>
                  <label className='main-content-label my-auto '>
                    {` العملاء `}
                  </label>
                </div>
                <DataTableExtensions {...tableUserData}>
                  <DataTable
                    columns={columnsUsers}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination

                    paginationServer
                    paginationTotalRows={totalRows}
                    paginationPerPage={perPage}
                    paginationRowsPerPageOptions={[20]}
                    onChangeRowsPerPage={handlePerRowsChange}
                    onChangePage={handlePageChange}
                  />
                </DataTableExtensions>
              </Card.Body>
              <Card.Body>
                <div className='mb-4'>
                  <label className='main-content-label my-auto '>
                    {` العمولات المسددة `}
                  </label>
                </div>
                <DataTableExtensions {...tablePayoutData}>
                  <DataTable
                    columns={columnsPayout}
                    defaultSortAsc={false}
                    // striped={true}
                    pagination
                  />
                </DataTableExtensions>
              </Card.Body>

            </Card>
          </Col>
        </Row>
        {/* <!-- End Row --> */}
        {payOutPopup && (
          <PayOutPopup
            setPayOutPopup={setPayOutPopup}

            setLoading={setLoading}
            loading={loading}
            id={id}


          />
        )}
      </div>
    </>
  );
};

Orders.layout = "Contentlayout";

export default Orders;
const PayOutPopup = ({
  setPayOutPopup,
  loading,
  setLoading,
  id,


}) => {
  const { token, id: adminId, user_type } = user;

  const [amount, setAmount] = useState();
  const [date, setDate] = useState();

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  async function handleEditQuantity(e) {
    e.preventDefault()
    const res = await fetch(
      `${baseUrl}/api/v1/sale-employee-payout/`,
      {
        method: "POST",
        body: JSON.stringify({ amount, sale_admin: id, pay_date: date }),
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      },
    );
    const result = await res.json();

    if (res.status === 200 || res.ok) {
      toast.success(result.message || "تم  التسجيل بنجاح");
      setPayOutPopup(false)
    } else {
      toast.error("حدث خطأ ما");
    }
    setLoading(false);

  }

  return (
    <div
      style={{ display: "block", backgroundColor: "rgba(0 ,0 ,0,0.5)" }}
      className='pos-fixed top-50 left-0 translate-middle-y w-100 min-vh-100 d-flex justify-content-center align-items-center'
    >
      <Card style={{ width: "50%", minWidth: "350px", maxWidth: "600px" }}>
        <Card.Header>
          <h3>  سداد عمولة</h3>
        </Card.Header>
        <Card.Body>
          <Form
            onSubmit={(e) =>
              handleEditQuantity(e)
            }
          >

            <Form.Group className='text-start form-group'>
              <Form.Label> المبلغ</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل المبلغ'
                name='amount'
                type='number'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className='text-start form-group'>
              <Form.Label> تاريخ السداد</Form.Label>
              <Form.Control
                className='form-control'
                placeholder='ادخل تاريخ السداد'
                name='date'
                type='date'
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </Form.Group>





            <div className='d-flex gap-4'>
              <Button
                disabled={loading}
                type='submit'
                className='btn ripple btn-main-primary btn-block mt-2 disabled:opacity-50 '
              >
                {loading
                  ? "جار تسجيل البيانات  ..."
                  : "  تسجيل"}
              </Button>
              <Button
                onClick={() => setPayOutPopup(false)}
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