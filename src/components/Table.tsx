import React, { Component } from "react";
import styled, { keyframes, css } from "styled-components";
import fakeDataBase from "../fakeData";

type CellProps = {
  width: number;
};

interface IColumn {
  name: string;
  width: number;
}

interface IProps {
  columns?: IColumn[];
  data?: object[] | null;
}

interface ISortConfig {
  name: string;
  direction: string;
}

interface IBoundLastColumn {
  name: string;
  bound: boolean;
}

interface IState {
  data: object[] | null;
  sortConfig: ISortConfig | null;
  boundLastColumn: IBoundLastColumn;
  animateRows: boolean;
  columns: IColumn[] | null;
}

const bounded = css`
  position: sticky;
  right: 0px;
  background-color: #e5f0ff;
  color: #2f3640;

  &.column-header {
    button {
      color: #01142f;
    }
  }
`;

const zoomIn = keyframes`
    0% {
      transform: scale(0);
    }
    100% {
      transform: scale(1);
    }
`;

const ArrowIcon = styled.div`
  margin-left: 5px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-color: ;
`;

const ArrowUp = styled(ArrowIcon)`
  border-bottom: 5px solid #d8664d;
`;

const ArrowDown = styled(ArrowIcon)`
  border-top: 5px solid #d8664d;
`;

const TableWrapper = styled.div`
  overflow: auto;
  position: relative;
  height: 100%;
`;

const Table = styled.table`
  border-collapse: collapse;
  border-spacing: 0;
`;

const TableHead = styled.thead``;

const TableHeaders = styled.tr`
  th:last-of-type {
    button:hover {
      background-color: #01142f20;
    }
  }
`;

const ColumnHeader = styled.th<CellProps>`
  background-color: #01142f;
  padding: 0;
  width: ${({ width }) => `${width}px`};
  &.bounded {
    ${bounded}
    }
  }
`;

const ColumnHeaderButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 40px;
  border: 0;
  margin: 0;
  padding: 0;
  background-color: transparent;
  color: #e6e7e8;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background-color: #e6e7e840;
  }
`;

const TableBody = styled.tbody`
  padding: 10px;
  color: #d5d5d5;
  tr:nth-child(odd) {
    background-color: #052555;
  }

  tr:nth-child(even) {
    background-color: #01142f;
  }
`;

const TableRow = styled.tr`
  &.animated {
    animation: ${zoomIn} 2s forwards;
  }
`;

const TableCell = styled.td<CellProps>`
  min-width: ${({ width }) => `${width}px`};
  padding: 5px 10px;
  text-align: center;
  box-sizing: border-box;

  &.bounded {
    ${bounded}
  }
`;

class CustomTable extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);
    this.state = {
      data: null,
      columns: null,
      sortConfig: null,
      boundLastColumn: { name: "", bound: false },
      animateRows: false,
    };
  }

  componentDidMount() {
    let columns = null;
    let data = null;
    const { columns: propsColumns, data: propsData } = this.props;
    const { columns: fakeColumns, data: fakeData } = fakeDataBase;
    if (
      Array.isArray(propsColumns) &&
      !!propsColumns.length &&
      Array.isArray(propsData) &&
      !!propsData.length
    ) {
      columns = propsColumns;
      data = propsData;
    } else if (
      Array.isArray(fakeColumns) &&
      !!fakeColumns.length &&
      Array.isArray(fakeData) &&
      !!fakeData.length
    ) {
      columns = fakeColumns;
      data = fakeData;
    }
    if (columns && data) {
      const lastColumn = columns[columns.length - 1];
      const lastColumnName = lastColumn.name;
      this.setState({ data });
      this.setState({ columns });
      this.setState((prevState) => ({
        boundLastColumn: {
          ...prevState.boundLastColumn,
          name: lastColumnName,
        },
      }));
      window.addEventListener("resize", () => this.handleResize());
    }
  }

  componentDidUpdate() {
    this.handleResize();
  }

  handleResize = (): void => {
    const { boundLastColumn } = this.state;
    const { bound } = boundLastColumn;
    const tableElement = document.getElementById("table");
    if (!tableElement) return;
    const tableBoundaries = tableElement.getBoundingClientRect();

    if (
      (tableBoundaries.right > window.innerWidth && !bound) ||
      (tableBoundaries.right < window.innerWidth && bound)
    )
      this.toggleLastColumn();
  };

  toggleLastColumn = (): void => {
    const { boundLastColumn } = this.state;
    const { name: lastColumnName } = boundLastColumn;

    const lastColumnElements: NodeListOf<HTMLElement> = document.querySelectorAll(
      `.${lastColumnName}-cell, #${lastColumnName}-header`
    );

    if (!!!lastColumnElements.length) return;
    this.setState((prevState) => ({
      boundLastColumn: {
        ...prevState.boundLastColumn,
        bound: !prevState.boundLastColumn.bound,
      },
    }));
    [...lastColumnElements].forEach((el) => {
      if (el.classList) {
        el.classList.toggle("bounded");
      }
    });
  };

  sortTableByColumnName = (
    event: React.MouseEvent<HTMLButtonElement>,
    headerName: string
  ): void => {
    event.preventDefault();
    const { data, sortConfig } = this.state;

    const sortableData = [...data];
    let direction = "asc";
    if (
      sortConfig &&
      sortConfig.name === headerName &&
      sortConfig.direction === "asc"
    ) {
      direction = "des";
    }

    

    sortableData.sort((a: any, b: any): number => {
      let first = a[headerName];
      let second = b[headerName];

      if (!first) {
        if (second) return direction === "asc" ? -1 : 1;
        return 0;
      } else if (!second) {
        if (first) return direction === "asc" ? 1 : -1;
        return 0;
      }

      if (!isNaN(first)) first = +first;
      if (!isNaN(second)) second = +second;

      if (first > second) {
        return direction === "asc" ? 1 : -1;
      }
      if (first < second) {
        return direction === "asc" ? -1 : 1;
      }
      return 0;
    });

    this.setState({ sortConfig: { name: headerName, direction } });
    this.setState({ data: sortableData });
    this.setState({ animateRows: true });
    setTimeout(() => {
      this.setState({ animateRows: false });
    }, 2000);
  };


  toggleSortingIcon = (columnName: string): JSX.Element | undefined => {
    const { sortConfig } = this.state;
    if (!sortConfig) return;
    if (sortConfig.name !== columnName) return;
    if (sortConfig.direction === "asc") return <ArrowUp />;
    return <ArrowDown />;
  };

  getHeaders = (): JSX.Element[] | undefined => {
    const { columns, animateRows } = this.state;
    if (columns) {
      return columns.map(
        ({ name: columnName, width: columnWidth }: IColumn, index: number) => {
          return (
            <ColumnHeader
              key={index}
              id={`${columnName}-header`}
              className={`column-header`}
              width={columnWidth}
            >
              <ColumnHeaderButton
                disabled={animateRows}
                type="button"
                onClick={(event) =>
                  this.sortTableByColumnName(event, columnName)
                }
              >
                <span>{columnName}</span>
                {this.toggleSortingIcon(columnName)}
              </ColumnHeaderButton>
            </ColumnHeader>
          );
        }
      );
    }
  };

  getTableBody = (): JSX.Element[] | undefined => {
    const { columns, data, animateRows } = this.state;
    if (data) {
      return data.map((row: any, rowIndex: number) => (
        <TableRow className={animateRows ? "animated" : ""} key={rowIndex}>
          {columns?.map(
            (
              { name: columnName, width: columnWidth }: IColumn,
              colIndex: number
            ) => (
              <TableCell
                className={`${columnName}-cell`}
                key={colIndex}
                width={columnWidth}
              >
                {row[columnName]}
              </TableCell>
            )
          )}
        </TableRow>
      ));
    }
  };

  render() {
    return (
      <TableWrapper>
        <Table id="table">
          <TableHead>
            <TableHeaders>{this.getHeaders()}</TableHeaders>
          </TableHead>
          <TableBody>{this.getTableBody()}</TableBody>
        </Table>
      </TableWrapper>
    );
  }
}

export default CustomTable;
