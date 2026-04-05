import React, { useEffect, useState } from "react";

import * as edashboard from "./edashboard";
import Chart from "chart.js/auto";
import { Card, Col, Row, Form, Button } from "react-bootstrap";
import { Line } from "react-chartjs-2";
import { useRouter } from "next/router";
// import card from "../../../../public/assets/img/card.svg";
// import creditCardIcon from "../../../../public/assets/img/creditCard.jpeg";
// import appledIcon from "../../../../public/assets/img/apple.png";
import dynamic from "next/dynamic";
const DataTable = dynamic(() => import("react-data-table-component"), {
  ssr: false,
});
const DataTableExtensions = dynamic(
  () => import("react-data-table-component-extensions"),
  { ssr: false },
);
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css"; // Main styles
import "react-date-range/dist/theme/default.css"; // Theme styles

const Dashboardecommerce = ({ user, stats, setStart, setEnd, start, end, getRealTimeUsersCount, notification, urgent, forceUpdate, urgentCount, notificationCount }) => {

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  const [realTimeUsersCount, setRealTimeUsersCount] = useState(0);
  const [isFilterModified, setIsFilterModified] = useState(false);
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)), // Default: Last 30 days
      endDate: new Date(),
      key: "selection",
    },
  ])
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [urgentFilter, setUrgentFilter] = useState("all");

  // Sync dateRange with start/end props (from URL)
  useEffect(() => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      
      setDateRange([
        {
          startDate: startDate,
          endDate: endDate,
          key: "selection",
        },
      ]);
    }
  }, [start, end]);

  // Filter notifications based on the selected filter
  const filteredNotifications = notification.filter((item) => {
    if (notificationFilter === "all") return true;
    if (notificationFilter === "PURCHASE_GROUP") {
      return item.object_type === "PURCHASE" || item.object_type === "PURCHASE_AND_PICK";
    }
    return item.object_type === notificationFilter;
  });

  // Filter urgent items based on the selected filter
  const filteredUrgent = urgent.filter((item) => {
    if (urgentFilter === "all") return true;
    if (urgentFilter === "PURCHASE_GROUP") {
      return item.object_type === "PURCHASE" || item.object_type === "PURCHASE_AND_PICK";
    }
    return item.object_type === urgentFilter;
  });
  const handleApply = () => {
    const start = dateRange[0].startDate.toLocaleDateString("en-CA"); // صيغة YYYY-MM-DD
    const end = dateRange[0].endDate.toLocaleDateString("en-CA"); // صيغة YYYY-MM-DD
    
    console.log("Applying date filter:", { start, end });
    
    setStart(start);
    setEnd(end);
    setShowDatePicker(false);
    setIsFilterModified(true);
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
    
    // Apply the date filter immediately
    const start = startDate.toLocaleDateString("en-CA");
    const end = endDate.toLocaleDateString("en-CA");
    
    console.log("Applying quick date filter:", { range, start, end });
    
    // Update parent component state
    setStart(start);
    setEnd(end);
    
    setIsFilterModified(true);
    setShowDatePicker(false);
  };
  const calcRealTimeUsersCount = async () => {
    const usersCount = await getRealTimeUsersCount();
    setRealTimeUsersCount(usersCount);

  }
  useEffect(() => {
    calcRealTimeUsersCount()
    // setStart("2024-01-01");
    // setEnd(
    //   new Date(new Date().setDate(new Date().getDate() + 1))
    //     .toISOString()
    //     .split("T")[0]
    // );
  }, [])
  const columns = [
    {
      name: "الاسم",
      selector: (row) => row.name, // Return the value directly
      cell: (row) => (
        <span className="font-weight-bold">
          {row.name}
        </span>
      ),
      sortable: true,
    },
    {
      name: "عدد الزيارات والتحميل",
      selector: (row) => row.count, // Return the number directly
      cell: (row) => (
        <span className="font-weight-bold">
          {row.count}
        </span>
      ),
      sortable: true,
    },
  ];


  const tableData = {
    columns,
    data: stats.statistics,
  };
  // setInterval(async () => {
  //   const usersCount = await getRealTimeUsersCount();
  //   setRealTimeUsersCount(usersCount);
  // }, 10000);

  //const { token, id, user_type } = user;

  const lineData = {
    labels: stats?.months,
    datasets: [
      {
        label: "السنة الحالية",
        data: stats?.sales_months,
        borderWidth: 3,
        backgroundColor: "transparent",
        borderColor: "#6259ca",
        pointBackgroundColor: "#ffffff",
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      },
    ],
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

  const handleItemClick = (item, event) => {
    // Check if this was a middle-click (button 1 is actually the middle button)
    const isMiddleClick = event.button === 1;
    
    // If middle click, prevent default behavior (like scrolling)
    if (isMiddleClick) {
      event.preventDefault();
    }
  
    fetch(`${baseUrl}/api/v1/notifications/${item.id}/mark-read/`, {
      method: "POST",
      headers: {
        "Authorization": user.token,
      }
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
        if (data.success) {
          forceUpdate();
          
          let url;
          switch (item.object_type) {
            case 'PURCHASE':
              url = `/dashboard/pages/purchases/${item.object_id}`;
              break;
            case 'PURCHASE_AND_PICK':
              url = `/dashboard/pages/purchasing_pick_process/${item.object_id}`;
              break;
            case 'SUPPORT_MESSAGE':
              url = `/dashboard/pages/support-messages?messageId=${item.object_id}`;
              break;
            case 'UNVERIFIED_CUSTOMER':
              url = `/dashboard/pages/users/${item.object_id}`;
              break;
            case 'RECEIPT':
              url = item.receipt.type == "hire" 
                ? `/dashboard/pages/purchases/${item.receipt.purchase_id}`
                : `/dashboard/pages/purchasing_pick_process/${item.receipt.purchase_id}`;
              break;
            case 'TRANSFER_REQUEST':
              url = '/dashboard/pages/wallets-transactions';
              break;
            default:
              url = '/other';
          }
  
          // Open in new tab for middle click, same tab for regular click
          if (isMiddleClick) {
            window.open(url, '_blank');
          } else {
            window.location.href = url;
          }
        }
      })
      .catch((err) => toast.error(err.error));
  };
  const handleItemRead = (item) => {
    fetch(`${baseUrl}/api/v1/notifications/${item.id}/mark-read/`, {
      method: "POST",

      headers: {
        "Authorization": user.token,
      }
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

        if (data.success) {
          forceUpdate()



        }

      })
      .catch((err) => toast.error(err.error));


  };
  const notificationIcon = (status) => {
    switch (status) {
      case "PURCHASE_AND_PICK":
        return "mdi-calendar-check";
      case "PURCHASE":
        return "mdi-calendar-check";
      case "RECEIPT":
        return " mdi-receipt";
      case "SUPPORT_MESSAGE":
        return "mdi-comment-alert-outline";
      case "TRANSFER_REQUEST":
        return " mdi-tumblr-reblog"
      case "UNVERIFIED_CUSTOMER":
        return " mdi-account"
      default:
        return " mdi-comment-alert-outline"; // Default color
    }
  };
  const getWidth = (count) => {
    if (count < 10) return '25px';   // 1 digit
    if (count < 100) return '30px';  // 2 digits
    return '40px';                    // 3 digits or more
  };
  return (
    <div>
      <Row className="row-sm mb-4">
        <Col sm={12} md={12} lg={6} xl={6}>
          <div>
            <Card className="p-3 shadow-sm border-0 rounded">
              <h5 className="mb-3 font-semibold d-flex justify-content-between">
                <div>
                  <i className="mdi mdi-alert-circle-outline icon-size fs-5 text-warning"></i>
                  <span className="ms-2">التنبيهات</span>
                  <span
                    className="ms-2 bg-danger rounded rounded-circle text-center"
                    style={{
                      display: "inline-block",
                      width: getWidth(urgentCount),
                      height: getWidth(urgentCount),
                      lineHeight: getWidth(urgentCount),
                    }}
                  >
                    {urgentCount}
                  </span>
                </div>
                {/* Filter Icons for Urgent */}
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`mdi mdi-filter-outline me-2 cursor-pointer ${urgentFilter === "all" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setUrgentFilter("all")}
                    title="الكل" // Tooltip for "All"
                  ></i>
                  <i
                    className={`mdi mdi-calendar-check me-2 cursor-pointer ${urgentFilter === "PURCHASE_GROUP" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setUrgentFilter("PURCHASE_GROUP")}
                    title="المشتريات" // Tooltip for "Purchases"
                  ></i>
                  <i
                    className={`mdi mdi-receipt me-2 cursor-pointer ${urgentFilter === "RECEIPT" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setUrgentFilter("RECEIPT")}
                    title="الإيصالات" // Tooltip for "Receipts"
                  ></i>
                  <i
                    className={`mdi mdi-comment-alert-outline me-2 cursor-pointer ${urgentFilter === "SUPPORT_MESSAGE" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setUrgentFilter("SUPPORT_MESSAGE")}
                    title="رسائل الدعم" // Tooltip for "Support Messages"
                  ></i>
                  <i
                    className={`mdi mdi-tumblr-reblog me-2 cursor-pointer ${urgentFilter === "TRANSFER_REQUEST" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setUrgentFilter("TRANSFER_REQUEST")}
                    title="طلبات التحويل" // Tooltip for "Transfer Requests"
                  ></i>
                  <i
                    className={`mdi mdi-account me-2 cursor-pointer ${urgentFilter === "UNVERIFIED_CUSTOMER" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setUrgentFilter("UNVERIFIED_CUSTOMER")}
                    title="عملاء غير موثقين" // Tooltip for "Unverified Customers"
                  ></i>
                </div>
              </h5>
              <ul
                className="list-group border-0 shadow-0"
                style={{ height: "250px", overflow: "auto" }}
              >
                {filteredUrgent.map((item) => {
                  const iconClass = notificationIcon(item?.object_type);
                  return (
                    <li
                      style={{ boxShadow: "1px 1px 4px #0003", margin: "0px 8px" }}
                      className="list-group-item d-flex border-0 mt-1 rounded-2 justify-content-start align-items-center cursor-pointer"
                    >
                      <div onClick={(e) => handleItemClick(item, e)}
                        onMouseDown={(e) => {
                          // Handle middle click on mouse down
                          if (e.button === 1) {
                            handleItemClick(item, e);
                          }
                        }} className="w-75">
                        <i className={`mdi ${iconClass} icon-size fs-5 text-primary`}></i>
                        <span className="ms-3">{item.body}</span>
                      </div>
                      <span className="w-25">
                        <button
                          onClick={() => handleItemRead(item)}
                          className="btn btn-primary btn-light"
                        >
                          مقروء
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </Col>
        <Col sm={12} md={12} lg={6} xl={6}>
          <div>
            <Card className="p-3 shadow-sm border-0 rounded">
              <h5 className="mb-3 font-semibold d-flex justify-content-between">
                <div>
                  <i className="mdi mdi-bell-outline icon-size fs-5 text-muted"></i>
                  <span className="ms-2">الإشعارات</span>
                  <span
                    className="ms-2 bg-danger rounded rounded-circle text-center"
                    style={{
                      display: "inline-block",
                      width: getWidth(notificationCount),
                      height: getWidth(notificationCount),
                      lineHeight: getWidth(notificationCount),
                    }}
                  >
                    {notificationCount}
                  </span>
                </div>
                {/* Filter Icons for Notifications */}
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`mdi mdi-filter-outline me-2 cursor-pointer ${notificationFilter === "all" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setNotificationFilter("all")}
                    title="الكل" // Tooltip for "All"
                  ></i>
                  <i
                    className={`mdi mdi-calendar-check me-2 cursor-pointer ${notificationFilter === "PURCHASE_GROUP" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setNotificationFilter("PURCHASE_GROUP")}
                    title="المشتريات" // Tooltip for "Purchases"
                  ></i>
                  <i
                    className={`mdi mdi-receipt me-2 cursor-pointer ${notificationFilter === "RECEIPT" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setNotificationFilter("RECEIPT")}
                    title="الإيصالات" // Tooltip for "Receipts"
                  ></i>
                  <i
                    className={`mdi mdi-comment-alert-outline me-2 cursor-pointer ${notificationFilter === "SUPPORT_MESSAGE" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setNotificationFilter("SUPPORT_MESSAGE")}
                    title="رسائل الدعم" // Tooltip for "Support Messages"
                  ></i>
                  <i
                    className={`mdi mdi-tumblr-reblog me-2 cursor-pointer ${notificationFilter === "TRANSFER_REQUEST" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setNotificationFilter("TRANSFER_REQUEST")}
                    title="طلبات التحويل" // Tooltip for "Transfer Requests"
                  ></i>
                  <i
                    className={`mdi mdi-account me-2 cursor-pointer ${notificationFilter === "UNVERIFIED_CUSTOMER" ? "text-primary" : "text-muted"
                      }`}
                    style={{ fontSize: "24px" }}
                    onClick={() => setNotificationFilter("UNVERIFIED_CUSTOMER")}
                    title="عملاء غير موثقين" // Tooltip for "Unverified Customers"
                  ></i>
                </div>
              </h5>
              <ul
                className="list-group border-0 shadow-0"
                style={{ height: "250px", overflow: "auto" }}
              >
                {filteredNotifications.map((item) => {
                  const iconClass = notificationIcon(item?.object_type);
                  return (
                    <li
                      style={{ boxShadow: "1px 1px 4px #0003", margin: "0px 8px" }}
                      className="list-group-item d-flex border-0 mt-1 rounded-2 justify-content-start align-items-center cursor-pointer"
                    >
                      <div onClick={(e) => handleItemClick(item, e)}
                        onMouseDown={(e) => {
                          // Handle middle click on mouse down
                          if (e.button === 1) {
                            handleItemClick(item, e);
                          }
                        }} className="w-75">
                        <i className={`mdi ${iconClass} icon-size fs-5 text-primary`}></i>
                        <span className="ms-3">{item.body}</span>
                      </div>
                      <span className="w-25">
                        <button
                          onClick={() => handleItemRead(item)}
                          className="btn btn-primary btn-light"
                        >
                          مقروء
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </Col>
      </Row>
      <Row className="mb-3 d-flex justify-content-start gap-2">
        <Col className="w-fit d-flex gap-2" lg={6} md={6}>
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
      <Row className='row-sm'>
        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order '>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                  المستخدمون
                </label>
                <h2 className='text-center card-item-icon card-icon'>
                  <i className='mdi mdi-account-multiple icon-size  text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                    {changeNumberFormate(stats?.users, "int")}
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
                  المستخدمون الحاليون
                </label>
                <h2 className='text-center card-item-icon card-icon'>
                  <i className='mdi mdi-account-multiple icon-size  text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                    {changeNumberFormate(realTimeUsersCount, "int")}
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
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                  عدد عمليات الشراء
                </label>
                <h2 className='text-center'>
                  <i className='mdi mdi-cube icon-size  text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                    {changeNumberFormate(stats?.total_processed_sales, "int")}
                  </span>
                </h2>
                {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>7,893</span>
                </p> */}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                  إجمالي المشتريات
                </label>
                <h2 className='text-center'>
                  <i className='mdi mdi-cube icon-size  text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                    {changeNumberFormate(
                      stats?.total_price_confirmed_purchases,
                      "float",
                    )}
                  </span>
                </h2>
                {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>7,893</span>
                </p> */}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                  تكلفة منتجات المخزون
                </label>
                <h2 className='text-center'>
                  <i className='mdi mdi-cube icon-size  text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                    {changeNumberFormate(
                      stats?.total_price_of_unsold_packages,
                      "float",
                    )}
                  </span>
                </h2>
                {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>7,893</span>
                </p> */}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                  سعر بيع منتجات المخزون
                </label>
                <h2 className='text-center'>
                  <i className='mdi mdi-cube icon-size  text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                    {changeNumberFormate(
                      stats?.total_price_of_sales_of_unsoled_packages,
                      "float",
                    )}
                  </span>
                </h2>
                {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>7,893</span>
                </p> */}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                  إجمالي الأرباح
                </label>
                <h2 className='text-center'>
                  <i className='icon-size mdi mdi-poll-box    text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                    {changeNumberFormate(stats?.total_profit, "float")}
                  </span>
                </h2>
                {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>4,678</span>
                </p> */}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: 'center', width: '100%' }}>
                  الدفع عن طريق التحويل البنكي
                </label>
                <h2 className='text-center'>
                  <i className='mdi mdi-bank icon-size text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: 'center', display: 'block' }} className='font-weight-bold'>

                    {changeNumberFormate(stats?.payments?.banktransfer?.total_amount, "float")} ريال
                  </span>
                </h2>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: 'center', width: '100%' }}>
                  الدفع عن طريق الفيزا
                </label>
                <h2 className='text-center'>
                  <i className='mdi mdi-credit-card icon-size text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: 'center', display: 'block' }} className='font-weight-bold'>
                    {changeNumberFormate(stats?.payments?.creditcard?.total_amount, "float")} ريال
                  </span>
                </h2>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: 'center', width: '100%' }}>
                  الدفع عن طريق أبل باي
                </label>
                <h2 className='text-center'>
                  <i className='mdi mdi-apple icon-size text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: 'center', display: 'block' }} className='font-weight-bold'>
                    {changeNumberFormate(stats?.payments?.applepay?.total_amount, "float")} ريال
                  </span>
                </h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={12} md={6} lg={6} xl={3}>
          <Card className='custom-card'>
            <Card.Body>
              <div className='card-order'>
                <label className='main-content-label mb-3 pt-1' style={{ textAlign: "center", width: "100%" }}>
                  إجمالي المحافظ
                </label>
                <h2 className='text-center'>
                  <i className='mdi mdi-wallet icon-size text-primary'></i>
                  <br /><br />
                  <span style={{ fontSize: 22, textAlign: "center", display: "block" }} className='font-weight-bold'>
                    {changeNumberFormate(stats?.total_wallets, "int")}
                  </span>
                </h2>
                {/* <p className='mb-0 mt-4 text-muted'>
                  آخر 30 يوما<span className='float-end'>3,756</span>
                </p> */}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className='row-sm bg-white mt-4'>
        <Card.Header className=' border-bottom-0 '>
          <label className='main-content-label my-auto pt-2'>
            إحصائيات الزيارات والتحميل
            <span className="ms-2 text-primary ">{stats.registerEmployee}</span>
          </label>

        </Card.Header>
        <Col xxl={6} xl={12} lg={12} md={12}>
          <Card className=''>
            <Card.Header className=' border-bottom-0 pb-10'>
              <div style={{ marginBottom: "-5px" }}>


              </div>
            </Card.Header>
            <Card.Body>
              <DataTableExtensions {...tableData}>
                <DataTable
                  columns={columns}
                  defaultSortAsc={false}
                  // striped={true}
                  pagination
                  paginationPerPage={50}
                  paginationRowsPerPageOptions={[10, 20, 50, 100, 150, 200]}
                />
              </DataTableExtensions>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <Row className='row-sm'>
        <Col xxl={12} xl={12} lg={12} md={12}>
          <Card className='custom-card'>
            <Card.Header className=' border-bottom-0'>
              <label className='main-content-label my-auto pt-2'>
                عمليات الشراء
              </label>
              <span
                style={{ fontSize: 22, textAlign: "center", display: "block" }}
                className='d-block tx-12 mb-0 mt-1 text-muted'
              >
                عمليات الشراء في الأشهر الماضية
              </span>
            </Card.Header>
            <Card.Body>
              <div className='chart-wrapper'>
                <Line
                  options={edashboard.Dashboard1}
                  data={lineData}
                  className='barchart'
                  height='270'
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboardecommerce;
