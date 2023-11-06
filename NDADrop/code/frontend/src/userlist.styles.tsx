import styled from "styled-components";

export const Wrapper =styled.div`
    overflow-y: auto;
    height: 90%;
    width: 30%;
    border: 1px solid gray;
    float: left;
    border-radius: 5px;
    min-height: 200px;
    margin: 5px;

    background-color: #EDEDED;
    font-size: 16px;
`;

export const UserWrapper = styled.div`
    border: 1px solid black;
    border-radius: 20px;
    margin: 5px;
    padding: 10px;
    background-color: #ffffff;
    font-size: 16px;

    button{
        border-radius: 5px;
        border: none;
        background-color: #0084ff;
        color: #ffffff;
        margin: 5px;
        clear: both;
        font-size: 16px;
        padding: 3px;

    }

    input{
        border-radius: 5px;
        border: 1px;
        margin-left: 5px;
        font-weight: bold;
        /* background-color: #0084ff;
        color: #ffffff; */
    }

    .userName{
        margin-left: 15px;
        font-weight: bold;
    }
    
`;

export const HeaderWrapper = styled.h2`
    text-align: center;  
`;

export const OutGoingWrapper = styled.div`
    padding-top: 3px;
    padding-bottom: 3px;
    //margin-left: 3px;
    //margin-right: 3px;
    //border: 1px solid black;
    //border-radius: 5px;

    button{
        border-radius: 5px;
        border: 1px;
        margin-left: 5px;
        font-weight: bold;
        background-color: #E71822;
    }

    p{
        padding-left: 2px;
        padding-right: 2px;
    }


    .bold{
        font-weight: bold;
    }
`;
