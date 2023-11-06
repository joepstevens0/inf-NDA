import styled from "styled-components";

export const Wrapper =styled.div`
    overflow-y: auto;
    height: fit-content;
    margin-top: 5px;
    margin-bottom: 5px;
    font-size: 16px;

    button{
        border-radius: 5px;
        border: none;
        margin-left: 5px;
        font-weight: bold;
        background-color: #EDEDED;
        padding: 3px;
    }

    

    div{
        padding: 5px;
        border: 1px solid black;
        border-radius: 5px;

    }

    p{
        padding-left:4px;
        padding-right: 4px;

    }

    .bold{
        font-weight: bold;
    }

    .color{
        background-color: #EDEDED;
        color: black;
    }


`;
